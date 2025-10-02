import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { User } from '../users/user.entity';
import { Recipe } from '../recipes/entities/recipe.entity';

@Injectable()
export class FavoritesService {
    constructor(
        @InjectRepository(Favorite) private readonly repo: Repository<Favorite>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
    ) {}

    async listByUser(userId: string) {
        return this.repo.find({
            where: { user: { id: userId } },
            relations: ['recipe'],
            order: { created_at: 'DESC' },
        });
    }

    async add(userId: string, recipeId: string) {
        const user = await this.userRepo.findOneByOrFail({ id: userId });
        const recipe = await this.recipeRepo.findOneByOrFail({ id: recipeId });
        const fav = this.repo.create({ user, recipe });
        return this.repo.save(fav).catch(() => {
            throw new Error('Already in favorites');
        });
    }

    async remove(userId: string, recipeId: string) {
        const fav = await this.repo.findOneOrFail({
            where: { user: { id: userId }, recipe: { id: recipeId } },
        });
        await this.repo.remove(fav);
        return { deleted: true };
    }

    async isFavorite(userId: string, recipeId: string) {
        const fav = await this.repo.findOne({
            where: { user: { id: userId }, recipe: { id: recipeId } },
        });
        return { isFavorite: !!fav };
    }

    async countFavorites(recipeId: string) {
        const count = await this.repo.count({
            where: { recipe: { id: recipeId } },
        });
        return { recipeId, count };
    }
}
