import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { User } from '../users/user.entity';

@Injectable()
export class RecipesService {
    constructor(
        private readonly dataSource: DataSource,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(RecipeIngredient) private readonly ingRepo: Repository<RecipeIngredient>,
        @InjectRepository(RecipeStep) private readonly stepRepo: Repository<RecipeStep>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) {}

    async findAll() {
        return this.recipeRepo.find({
            relations: { owner: true },
            order: { created_at: 'DESC' },
            take: 50,
        });
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

            return recipe;
        });
    }
}
