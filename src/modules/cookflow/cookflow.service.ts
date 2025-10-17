import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QueueItem } from './queue-item.entity';
import { CookedRecipe } from './cooked-recipe.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipeIngredient } from '../recipes/entities/recipe-ingredient.entity';
import { RecipeStep } from '../recipes/entities/recipe-step.entity';
import { PublicRecipeService } from '../publicRecipe/publicRecipe.service';
import { PublicRecipeImportDto } from '../publicRecipe/dto/public-recipe-import.dto';

@Injectable()
export class CookflowService {
    constructor(
        @InjectRepository(QueueItem) private readonly queueRepo: Repository<QueueItem>,
        @InjectRepository(CookedRecipe) private readonly cookedRepo: Repository<CookedRecipe>,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(RecipeIngredient) private readonly ingRepo: Repository<RecipeIngredient>,
        @InjectRepository(RecipeStep) private readonly stepRepo: Repository<RecipeStep>,
        private readonly publicService: PublicRecipeService,
    ) {}

    // Returns queued recipes with full recipe data, ingredients and steps
    async listQueue(userId: string) {
        const items = await this.queueRepo.find({
            where: { user: { id: userId } },
            relations: { recipe: { owner: true } },
            order: { created_at: 'DESC' },
        });

        const recipeIds = items.map((i) => i.recipe.id);
        if (recipeIds.length === 0) return [];

        // Preload ingredients and steps in parallel to avoid N+1
        const [allIngredients, allSteps] = await Promise.all([
            this.ingRepo.find({
                where: { recipe: { id: In(recipeIds) } },
                relations: { recipe: true },
                order: { position: 'ASC' },
            }),
            this.stepRepo.find({
                where: { recipe: { id: In(recipeIds) } },
                relations: { recipe: true },
                order: { step_no: 'ASC' },
            }),
        ]);

        // Group ingredients by recipe ID
        const ingredientsByRecipeId = new Map<string, any[]>();
        for (const ing of allIngredients) {
            const rid = (ing as any).recipe.id as string;
            const arr = ingredientsByRecipeId.get(rid) ?? [];
            arr.push({
                id: (ing as any).id,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                position: (ing as any).position,
            });
            ingredientsByRecipeId.set(rid, arr);
        }

        // Group steps by recipe ID
        const stepsByRecipeId = new Map<string, any[]>();
        for (const st of allSteps) {
            const rid = (st as any).recipe.id as string;
            const arr = stepsByRecipeId.get(rid) ?? [];
            arr.push({
                id: (st as any).id,
                step_no: (st as any).step_no,
                content: st.content,
                image_url: (st as any).image_url,
            });
            stepsByRecipeId.set(rid, arr);
        }

        return items.map(({ recipe }) => ({
            ...recipe,
            ingredients: ingredientsByRecipeId.get(recipe.id) ?? [],
            steps: stepsByRecipeId.get(recipe.id) ?? [],
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

    // Returns cooked recipes list with full recipe data, ingredients and steps
    async listCooked(userId: string) {
        const items = await this.cookedRepo.find({
            where: { user: { id: userId } },
            relations: { recipe: { owner: true } },
            order: { cooked_at: 'DESC' },
        });

        const recipeIds = items.map((i) => i.recipe.id);
        if (recipeIds.length === 0) return [];

        // Preload ingredients and steps in parallel to avoid N+1
        const [allIngredients, allSteps] = await Promise.all([
            this.ingRepo.find({
                where: { recipe: { id: In(recipeIds) } },
                relations: { recipe: true },
                order: { position: 'ASC' },
            }),
            this.stepRepo.find({
                where: { recipe: { id: In(recipeIds) } },
                relations: { recipe: true },
                order: { step_no: 'ASC' },
            }),
        ]);

        // Group ingredients by recipe ID
        const ingredientsByRecipeId = new Map<string, any[]>();
        for (const ing of allIngredients) {
            const rid = (ing as any).recipe.id as string;
            const arr = ingredientsByRecipeId.get(rid) ?? [];
            arr.push({
                id: (ing as any).id,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                position: (ing as any).position,
            });
            ingredientsByRecipeId.set(rid, arr);
        }

        // Group steps by recipe ID
        const stepsByRecipeId = new Map<string, any[]>();
        for (const st of allSteps) {
            const rid = (st as any).recipe.id as string;
            const arr = stepsByRecipeId.get(rid) ?? [];
            arr.push({
                id: (st as any).id,
                step_no: (st as any).step_no,
                content: st.content,
                image_url: (st as any).image_url,
            });
            stepsByRecipeId.set(rid, arr);
        }

        return items.map(({ recipe }) => ({
            ...recipe,
            ingredients: ingredientsByRecipeId.get(recipe.id) ?? [],
            steps: stepsByRecipeId.get(recipe.id) ?? [],
        }));
    }

    // Add a public recipe to queue (imports to local DB first if needed)
    async addFromPublic(userId: string, dto: PublicRecipeImportDto) {
        const { recipe } = await this.publicService.ensureLocalRecipeFromPublic(dto, userId);
        return this.addToQueue(userId, recipe.id);
    }
}
