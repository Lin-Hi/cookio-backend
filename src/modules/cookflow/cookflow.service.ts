import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QueueItem } from './queue-item.entity';
import { CookedRecipe } from './cooked-recipe.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipeIngredient } from '../recipes/entities/recipe-ingredient.entity';

@Injectable()
export class CookflowService {
    constructor(
        @InjectRepository(QueueItem) private readonly queueRepo: Repository<QueueItem>,
        @InjectRepository(CookedRecipe) private readonly cookedRepo: Repository<CookedRecipe>,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(RecipeIngredient) private readonly ingRepo: Repository<RecipeIngredient>,
    ) {}

    // Returns queued recipes with minimal fields and ingredients array
    async listQueue(userId: string) {
        const items = await this.queueRepo.find({
            where: { user: { id: userId } },
            relations: { recipe: true },
            order: { created_at: 'DESC' },
        });

        const recipeIds = items.map((i) => i.recipe.id);
        if (recipeIds.length === 0) return [];

        // Preload ingredients in one query to avoid N+1
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

    // Idempotent add to queue; 404 if recipe does not exist
    async addToQueue(userId: string, recipeId: string) {
        const exists = await this.queueRepo.findOne({ where: { user: { id: userId }, recipe: { id: recipeId } } });
        if (exists) return { success: true };
        const recipe = await this.recipeRepo.findOne({ where: { id: recipeId } });
        if (!recipe) throw new NotFoundException('Recipe not found');
        await this.queueRepo.save(this.queueRepo.create({ user: { id: userId } as any, recipe }));
        return { success: true };
    }

    // Idempotent removal
    async removeFromQueue(userId: string, recipeId: string) {
        await this.queueRepo.delete({ user: { id: userId } as any, recipe: { id: recipeId } as any });
        return { success: true };
    }

    // Batch move queued → cooked, ignoring already-cooked recipes
    async moveToCooked(userId: string, recipeIds: string[]) {
        if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
            return { success: true, moved: 0 };
        }

        await this.queueRepo.delete({ user: { id: userId } as any, recipe: { id: In(recipeIds) } as any });

        const existing = await this.cookedRepo.find({
            where: { user: { id: userId }, recipe: { id: In(recipeIds) } },
            relations: { recipe: true },
        });
        const existingSet = new Set(existing.map((c) => c.recipe.id));
        const toInsertIds = recipeIds.filter((id) => !existingSet.has(id));

        if (toInsertIds.length) {
            const recipes = await this.recipeRepo.find({ where: { id: In(toInsertIds) } });
            const rows = recipes.map((r) => this.cookedRepo.create({ user: { id: userId } as any, recipe: r }));
            await this.cookedRepo.save(rows);
        }
        return { success: true, moved: recipeIds.length };
    }

    // Returns cooked recipes list (no ingredients) for history view
    async listCooked(userId: string) {
        const items = await this.cookedRepo.find({
            where: { user: { id: userId } },
            relations: { recipe: true },
            order: { cooked_at: 'DESC' },
        });
        return items.map(({ recipe }) => ({
            id: recipe.id,
            title: recipe.title,
            image_url: (recipe as any).image_url,
            cook_time: (recipe as any).cook_time,
            category: (recipe as any).category,
        }));
    }
}
