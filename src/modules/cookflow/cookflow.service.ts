import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QueueItem } from './queue-item.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipeIngredient } from '../recipes/entities/recipe-ingredient.entity';

@Injectable()
export class CookflowService {
    constructor(
        @InjectRepository(QueueItem) private readonly queueRepo: Repository<QueueItem>,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(RecipeIngredient) private readonly ingRepo: Repository<RecipeIngredient>,
    ) {}

    async listQueue(userId: string) {
        const items = await this.queueRepo.find({
            where: { user: { id: userId } },
            relations: { recipe: true },
            order: { created_at: 'DESC' },
        });

        const recipeIds = items.map((i) => i.recipe.id);
        if (recipeIds.length === 0) return [];

        // 一次性预加载配料，避免 N+1
        const ings = await this.ingRepo.find({
            where: { recipe: { id: In(recipeIds) } },
            relations: { recipe: true },
            order: { position: 'ASC' },
        });
        const byRecipe = new Map<string, any[]>();
        for (const ing of ings) {
            const rid = (ing as any).recipe.id as string;
            const arr = byRecipe.get(rid) ?? [];
            arr.push({ name: ing.name, quantity: ing.quantity, unit: ing.unit, position: (ing as any).position });
            byRecipe.set(rid, arr);
        }

        return items.map(({ recipe }) => ({
            id: recipe.id,
            title: recipe.title,
            image_url: (recipe as any).image_url,
            cook_time: (recipe as any).cook_time,
            category: (recipe as any).category,
            ingredients: byRecipe.get(recipe.id) ?? [],
        }));
    }

    async addToQueue(userId: string, recipeId: string) {
        const exists = await this.queueRepo.findOne({ where: { user: { id: userId }, recipe: { id: recipeId } } });
        if (exists) return { success: true }; // 幂等
        const recipe = await this.recipeRepo.findOne({ where: { id: recipeId } });
        if (!recipe) throw new NotFoundException('Recipe not found');
        await this.queueRepo.save(this.queueRepo.create({ user: { id: userId } as any, recipe }));
        return { success: true };
    }

    async removeFromQueue(userId: string, recipeId: string) {
        await this.queueRepo.delete({ user: { id: userId } as any, recipe: { id: recipeId } as any });
        return { success: true };
    }
}
