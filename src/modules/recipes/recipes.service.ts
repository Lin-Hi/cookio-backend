import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {DataSource, ILike, In, Repository} from 'typeorm';
import {Recipe} from './entities/recipe.entity';
import {RecipeIngredient} from './entities/recipe-ingredient.entity';
import {RecipeStep} from './entities/recipe-step.entity';
import {CreateRecipeDto} from './dto/create-recipe.dto';
import {UpdateRecipeDto} from './dto/update-recipe.dto';
import {User} from '../users/user.entity';
import {ReviewsService} from '../reviews/reviews.service';

type FindAllParams = {
    q?: string;
    category?: string;
    difficulty?: string;
    ownerId?: string;
    source?: 'community' | 'edamam' | 'spoonacular';
    is_published?: boolean;
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
        private readonly reviewsService: ReviewsService,
    ) {
    }

    async findAll(params: FindAllParams) {
        const {q, category, difficulty, ownerId, source = 'community', is_published, page, pageSize} = params;

        // build a common base filter; we'll reuse it for OR search when q is present
        const common: any = {};
        if (category) common.category = category;
        if (difficulty) common.difficulty = difficulty;
        if (ownerId) common.owner = {id: ownerId};
        if (source) common.source = source;                 // default is 'community'
        if (typeof is_published === 'boolean') common.is_published = is_published;
        // when q exists, search title OR description using array "where" (OR)
        let where: any = common;
        if (q) {
            const like = ILike(`%${q}%`);
            where = [
                {...common, title: like},
                {...common, description: like},
            ];
        }


        const [items, total] = await this.recipeRepo.findAndCount({
            where,
            relations: {owner: true},
            order: {created_at: 'DESC'},
            skip: (page - 1) * pageSize,
            take: pageSize,
        });

        if (items.length === 0) {
            return {items: [], total, page, pageSize};
        }

        const recipeIds = items.map((r) => r.id);

        const [allIngredients, allSteps] = await Promise.all([
            this.ingRepo.find({
                where: {recipe: {id: In(recipeIds)}},
                order: {position: 'ASC'},
                relations: {recipe: true},
            }),
            this.stepRepo.find({
                where: {recipe: {id: In(recipeIds)}},
                order: {step_no: 'ASC'},
                relations: {recipe: true},
            }),
        ]);

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

        const mapped = items.map((r) => ({
            ...r,
            ingredients: ingredientsByRecipeId.get(r.id) ?? [],
            steps: stepsByRecipeId.get(r.id) ?? [],
        }));

        return {items: mapped, total, page, pageSize};
    }

    async findOne(id: string) {
        const recipe = await this.recipeRepo.findOneOrFail({
            where: {id},
            relations: {owner: true},
        });
        if (!recipe) throw new Error('Recipe not found');

        const [ingredients, steps] = await Promise.all([
            this.ingRepo.find({where: {recipe: {id}}, order: {position: 'ASC'}}),
            this.stepRepo.find({where: {recipe: {id}}, order: {step_no: 'ASC'}}),
        ]);

        const {avgRating, reviewsCount} = await this.reviewsService.summary(id);

        return {
            ...recipe,
            ingredients,
            steps,
            ratingSummary: {
                average: avgRating,
                count: reviewsCount,
            },
        };
    }


    async create(dto: CreateRecipeDto) {
        return this.dataSource.transaction(async (manager) => {
            const owner = await manager.findOneByOrFail(User, {id: dto.owner_id});

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
                const ingredients = dto.ingredients.map((i, idx) =>
                    manager.create(RecipeIngredient, {
                        recipe,
                        name: i.name,
                        quantity: i.quantity,
                        unit: i.unit,
                        position: typeof i.position === 'number' ? i.position : idx,
                    }),
                );
                if (ingredients.length) await manager.save(ingredients);
            }

            if (dto.steps?.length) {
                const steps = dto.steps.map((s) =>
                    manager.create(RecipeStep, {
                        recipe,
                        step_no: s.step_no,
                        content: s.content,
                        image_url: s.image_url,
                    }),
                );
                if (steps.length) await manager.save(steps);
            }

            // assemble response within the same transaction
            const [ingredients, steps] = await Promise.all([
                manager.find(RecipeIngredient, {
                    where: {recipe: {id: recipe.id}},
                    order: {position: 'ASC'},
                }),
                manager.find(RecipeStep, {
                    where: {recipe: {id: recipe.id}},
                    order: {step_no: 'ASC'},
                }),
            ]);

            // "owner" is already loaded variable above
            return {...recipe, owner, ingredients, steps};
        });
    }

    // Update a recipe in a single transaction.
    // - Update basic fields if provided.
    // - If "ingredients" provided: delete all existing ingredients and re-insert in the given order.
    // - If "steps" provided: delete all existing steps and re-insert in the given order.
    // This approach is idempotent and easy to reason about on the client (full replace).
    async update(id: string, dto: UpdateRecipeDto) {
        return this.dataSource.transaction(async (manager) => {
            const recipe = await manager.findOne(Recipe, {where: {id}});
            if (!recipe) throw new Error('Recipe not found');

            // Patch base fields
            manager.merge(Recipe, recipe, {
                title: dto.title ?? recipe.title,
                description: dto.description ?? recipe.description,
                image_url: dto.image_url ?? recipe.image_url,
                category: dto.category ?? recipe.category,
                difficulty: dto.difficulty ?? recipe.difficulty,
                cook_time: dto.cook_time ?? recipe.cook_time,
                servings: dto.servings ?? recipe.servings,
                is_published: dto.is_published ?? recipe.is_published,
            });
            await manager.save(recipe);

            // Replace ingredients
            if (Array.isArray(dto.ingredients)) {
                await manager.delete(RecipeIngredient, {recipe: {id: recipe.id}});
                const newIngredients = dto.ingredients.map((i, idx) =>
                    manager.create(RecipeIngredient, {
                        recipe,
                        name: i.name,
                        quantity: i.quantity,
                        unit: i.unit,
                        position: i.position ?? idx,
                    }),
                );
                if (newIngredients.length) await manager.save(newIngredients);
            }

            // Replace steps
            if (Array.isArray(dto.steps)) {
                await manager.delete(RecipeStep, {recipe: {id: recipe.id}});
                const newSteps = dto.steps.map((s) =>
                    manager.create(RecipeStep, {
                        recipe,
                        step_no: s.step_no,
                        content: s.content,
                        image_url: s.image_url,
                    }),
                );
                if (newSteps.length) await manager.save(newSteps);
            }

            const [ingredients, steps] = await Promise.all([
                manager.find(RecipeIngredient, {where: {recipe: {id: recipe.id}}, order: {position: 'ASC'}}),
                manager.find(RecipeStep, {where: {recipe: {id: recipe.id}}, order: {step_no: 'ASC'}}),
            ]);
            return {...recipe, ingredients, steps};
        });
    }

    async remove(id: string) {
        return this.dataSource.transaction(async (manager) => {
            const recipe = await manager.findOne(Recipe, {where: {id}});
            if (!recipe) throw new Error('Recipe not found');
            await manager.delete(Recipe, {id});
            return {deleted: true};
        });
    }
}
