import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueItem } from './queue-item.entity';
import { CookedRecipe } from './cooked-recipe.entity';
import { CookflowService } from './cookflow.service';
import { CookflowController } from './cookflow.controller';
import { Recipe } from '../recipes/entities/recipe.entity';
import { RecipeIngredient } from '../recipes/entities/recipe-ingredient.entity';
import { PublicRecipeModule } from '../publicRecipe/publicRecipe.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([QueueItem, CookedRecipe, Recipe, RecipeIngredient]),
        PublicRecipeModule,
    ],
    controllers: [CookflowController],
    providers: [CookflowService],
    exports: [CookflowService],
})
export class CookflowModule {}
