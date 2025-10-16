import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueItem } from './queue-item.entity';
import { CookedRecipe } from './cooked-recipe.entity';
import { CookflowService } from './cookflow.service';
import { CookflowController } from './cookflow.controller';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipeIngredient } from '../recipes/entities/recipe-ingredient.entity';
import { RecipeStep } from '../recipes/entities/recipe-step.entity';
import { PublicRecipeModule } from '../publicRecipe/publicRecipe.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([QueueItem, CookedRecipe, Recipe, RecipeIngredient, RecipeStep]),
        PublicRecipeModule,
    ],
    controllers: [CookflowController],
    providers: [CookflowService],
    exports: [CookflowService],
})
export class CookflowModule {}
