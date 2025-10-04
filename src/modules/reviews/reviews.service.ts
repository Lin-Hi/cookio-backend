import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { RecipeReview } from './review.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { User } from '../users/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { QueryReviewsDto } from './dto/query-reviews.dto';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(RecipeReview) private readonly repo: Repository<RecipeReview>,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) {}

    /** Ensure recipe exists */
    private async mustGetRecipe(recipeId: string): Promise<Recipe> {
        const recipe = await this.recipeRepo.findOne({ where: { id: recipeId } as FindOptionsWhere<Recipe> });
        if (!recipe) throw new NotFoundException('Recipe not found');
        return recipe;
    }

    /** Create or replace a review for (user, recipe). Enforces 1 review per user */
    async create(userId: string, recipeId: string, dto: CreateReviewDto) {
        const [recipe, user] = await Promise.all([
            this.mustGetRecipe(recipeId),
            this.userRepo.findOne({ where: { id: userId } }),
        ]);
        if (!user) throw new NotFoundException('User not found');

        // Upsert: if user already reviewed this recipe, update it instead of failing
        const existing = await this.repo.findOne({
            where: { recipe: { id: recipe.id }, user: { id: user.id } },
            relations: { recipe: true, user: true },
        });

        if (existing) {
            existing.rating = dto.rating;
            existing.content = dto.content ?? null;
            const saved = await this.repo.save(existing);
            return { ...saved, updated: true };
        }

        const entity = this.repo.create({
            recipe,
            user,
            rating: dto.rating,
            content: dto.content ?? null,
        });
        const saved = await this.repo.save(entity);
        return { ...saved, created: true };
    }

    /** List reviews of a recipe with pagination and sorting */
    async list(recipeId: string, q: QueryReviewsDto) {
        await this.mustGetRecipe(recipeId);
        const qb = this.repo
            .createQueryBuilder('rv')
            .leftJoinAndSelect('rv.user', 'u')
            .where('rv.recipeId = :recipeId', { recipeId });

        switch (q.sort) {
            case 'oldest':
                qb.orderBy('rv.createdAt', 'ASC');
                break;
            case 'rating':
                qb.orderBy('rv.rating', 'ASC');
                break;
            case 'rating_desc':
                qb.orderBy('rv.rating', 'DESC');
                break;
            default:
                qb.orderBy('rv.createdAt', 'DESC');
        }

        const page = q.page ?? 1;
        const limit = Math.min(q.limit ?? 10, 50);
        qb.skip((page - 1) * limit).take(limit);

        const [items, total] = await qb.getManyAndCount();
        return {
            items,
            pageInfo: {
                page,
                limit,
                total,
                hasNext: page * limit < total,
            },
        };
    }

    /** Update a review. Only author or admin can update */
    async update(reviewId: string, currentUser: { id: string; roles?: string[] }, dto: UpdateReviewDto) {
        const rv = await this.repo.findOne({
            where: { id: reviewId },
            relations: { user: true },
        });
        if (!rv) throw new NotFoundException('Review not found');

        const isOwner = rv.user?.id === currentUser.id;
        const isAdmin = currentUser.roles?.includes('admin');
        if (!isOwner && !isAdmin) throw new ForbiddenException('Not allowed');

        if (dto.rating !== undefined) {
            if (dto.rating < 1 || dto.rating > 5) throw new BadRequestException('rating must be 1..5');
            rv.rating = dto.rating;
        }
        if (dto.content !== undefined) rv.content = dto.content ?? null;

        return this.repo.save(rv);
    }

    /** Delete a review. Only author or admin */
    async remove(reviewId: string, currentUser: { id: string; roles?: string[] }) {
        const rv = await this.repo.findOne({
            where: { id: reviewId },
            relations: { user: true },
        });
        if (!rv) throw new NotFoundException('Review not found');

        const isOwner = rv.user?.id === currentUser.id;
        const isAdmin = currentUser.roles?.includes('admin');
        if (!isOwner && !isAdmin) throw new ForbiddenException('Not allowed');

        await this.repo.remove(rv);
        return { ok: true };
    }
}
