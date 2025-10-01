import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { User } from '../users/user.entity';

type FindAllParams = {
    q?: string;
    category?: string;
    difficulty?: string;
    ownerId?: string;
    page: number;
    pageSize: number;
};

@Injectable()
export class RecipesService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(RecipeIngredient) private readonly ingRepo: Repository<RecipeIngredient>,
        @InjectRepository(RecipeStep) private readonly stepRepo: Repository<RecipeStep>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) {}

    async findAll(params: FindAllParams) {
        const { q, category, difficulty, ownerId, page, pageSize } = params;
        const where: any = {};
        if (q) where.title = ILike(`%${q}%`);
        if (category) where.category = category;
        if (difficulty) where.difficulty = difficulty;
        if (ownerId) where.owner = { id: ownerId };

        const [items, total] = await this.recipeRepo.findAndCount({
            where,
            relations: { owner: true },
            order: { created_at: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        return { items, total, page, pageSize };
    }

    async findOne(id: string) {
        const recipe = await this.recipeRepo.findOneOrFail({
            where: { id },
            relations: { owner: true },
        });
        const [ingredients, steps] = await Promise.all([
            this.ingRepo.find({ where: { recipe: { id } }, order: { position: 'ASC' } }),
            this.stepRepo.find({ where: { recipe: { id } }, order: { step_no: 'ASC' } }),
        ]);
        return { ...recipe, ingredients, steps };
    }

    async create(dto: CreateRecipeDto) {
        return this.dataSource.transaction(async (manager) => {
            const owner = await manager.findOneByOrFail(User, { id: dto.owner_id });

            const recipe = manager.create(Recipe, {
                owner,
                title: dto.title,
                description: dto.description,
                image_url: dto.image_url,
                category: dto.category,
                difficulty: dto.difficulty,
                cook_time: dto.cook_time,
                servings: dto.servings,
                is_published: dto.is_published ?? false,
            });
            await manager.save(recipe);

            if (dto.ingredients?.length) {
                const ingredients = dto.ingredients.map((i) =>
                    manager.create(RecipeIngredient, {
                        recipe, name: i.name, quantity: i.quantity, unit: i.unit, position: i.position ?? 0,
                    }),
                );
                await manager.save(ingredients);
            }

            if (dto.steps?.length) {
                const steps = dto.steps.map((s) =>
                    manager.create(RecipeStep, {
                        recipe, step_no: s.step_no, content: s.content, image_url: s.image_url,
                    }),
                );
                await manager.save(steps);
            }

            return this.findOne(recipe.id);
        });
    }

    // Update a recipe in a single transaction.
    // - Update basic fields if provided.
    // - If "ingredients" provided: delete all existing ingredients and re-insert in the given order.
    // - If "steps" provided: delete all existing steps and re-insert in the given order.
    // This approach is idempotent and easy to reason about on the client (full replace).
    async update(id: string, dto: UpdateRecipeDto) {
        return this.dataSource.transaction(async (manager) => {
            // 1) Load existing recipe (with owner just for consistency)
            const recipe = await manager.findOne(Recipe, { where: { id }, relations: { owner: true } });
            if (!recipe) throw new Error('Recipe not found');

            // 2) Patch basic fields if present
            const patch: Partial<Recipe> = {
                title: dto.title ?? recipe.title,
                description: dto.description ?? recipe.description,
                image_url: dto.image_url ?? recipe.image_url,
                category: dto.category ?? recipe.category,
                difficulty: dto.difficulty ?? recipe.difficulty,
                cook_time: dto.cook_time ?? recipe.cook_time,
                servings: dto.servings ?? recipe.servings,
                is_published: dto.is_published ?? recipe.is_published,
            };
            manager.merge(Recipe, recipe, patch);
            await manager.save(recipe);

            // 3) Replace ingredients if provided
            if (Array.isArray(dto.ingredients)) {
                await manager.delete(RecipeIngredient, { recipe: { id: recipe.id } });

                const normIngredients = dto.ingredients.map((i, idx) =>
                    manager.create(RecipeIngredient, {
                        recipe,
                        name: i.name,
                        quantity: i.quantity,
                        unit: i.unit,
                        // If position is not given, keep array order 0..n
                        position: typeof i.position === 'number' ? i.position : idx,
                    }),
                );
                if (normIngredients.length) {
                    await manager.save(normIngredients);
                }
            }

            // 4) Replace steps if provided
            if (Array.isArray(dto.steps)) {
                await manager.delete(RecipeStep, { recipe: { id: recipe.id } });

                // Ensure step_no is 1..n by client, otherwise we can normalize here
                const normSteps = dto.steps.map((s) =>
                    manager.create(RecipeStep, {
                        recipe,
                        step_no: s.step_no,
                        content: s.content,
                        image_url: s.image_url,
                    }),
                );
                if (normSteps.length) {
                    await manager.save(normSteps);
                }
            }

            // 5) Return fresh snapshot with children
            const [ingredients, steps] = await Promise.all([
                manager.find(RecipeIngredient, { where: { recipe: { id: recipe.id } }, order: { position: 'ASC' } }),
                manager.find(RecipeStep, { where: { recipe: { id: recipe.id } }, order: { step_no: 'ASC' } }),
            ]);
            return { ...recipe, ingredients, steps };
        });
    }
}
