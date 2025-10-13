import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { User } from '../users/user.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { FavoriteResponseDto, FavoriteCheckDto, FavoriteCountDto } from './dto/favorite-response.dto';
import {PublicRecipeService} from "../publicRecipe/publicRecipe.service";
import {PublicRecipeImportDto} from "../publicRecipe/dto/public-recipe-import.dto";

@Injectable()
export class FavoritesService {
    constructor(
        @InjectRepository(Favorite) private readonly repo: Repository<Favorite>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        private readonly publicService: PublicRecipeService,
    ) {}


    async listByUser(userId: string, page = 1, limit = 10) {
        const [favorites, total] = await this.repo.findAndCount({
            where: { user: { id: userId } },
            relations: ['recipe'],
            order: { created_at: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            total,
            page,
            limit,
            data: favorites.map(f => ({
                recipeId: f.recipe.id,
                title: f.recipe.title,
                favoritedAt: f.created_at,
            })),
        };
    }


    async add(userId: string, recipeId: string): Promise<FavoriteResponseDto> {
        const user = await this.userRepo.findOneByOrFail({ id: userId });
        const recipe = await this.recipeRepo.findOneByOrFail({ id: recipeId });

        const existing = await this.repo.findOne({
            where: { user: { id: userId }, recipe: { id: recipeId } },
        });
        if (existing) {
            throw new ConflictException('Recipe already in favorites');
        }

        const fav = this.repo.create({ user, recipe });
        const saved = await this.repo.save(fav);

        return {
            recipeId: recipe.id,
            title: recipe.title,
            favoritedAt: saved.created_at,
        };
    }

    async remove(userId: string, recipeId: string) {
        const fav = await this.repo.findOne({
            where: { user: { id: userId }, recipe: { id: recipeId } },
        });
        if (!fav) {
            throw new NotFoundException('Favorite not found');
        }
        await this.repo.remove(fav);
        return { deleted: true };
    }

    async isFavorite(userId: string, recipeId: string): Promise<FavoriteCheckDto> {
        const fav = await this.repo.findOne({
            where: { user: { id: userId }, recipe: { id: recipeId } },
        });
        return { isFavorite: !!fav };
    }

    async countFavorites(recipeId: string): Promise<FavoriteCountDto> {
        const count = await this.repo.count({
            where: { recipe: { id: recipeId } },
        });
        return { recipeId, count };
    }

    async isFavoriteByExternal(source: 'edamam'|'spoonacular', sourceId: string) {
        const recipe = await this.recipeRepo.findOne({ where: { source, sourceId } });
        if (!recipe) return { isFavorite: false, recipeId: null };
        const count = await this.repo.count({ where: { recipe: { id: recipe.id } } });
        return { isFavorite: count > 0, recipeId: recipe.id };
    }

    async getLocalRecipeByExternal(source: 'edamam'|'spoonacular', sourceId: string) {
        const recipe = await this.recipeRepo.findOne({
            where: { source, sourceId },
            relations: ['ingredients', 'steps', 'owner'],
        });
        if (!recipe) {
            throw new NotFoundException('Recipe not imported locally');
        }
        return recipe;
    }

    async addFromPublic(userId: string, dto: PublicRecipeImportDto) {
        const { recipe } = await this.publicService.ensureLocalRecipeFromPublic(dto, userId);
        return this.add(userId, recipe.id);
    }
}
