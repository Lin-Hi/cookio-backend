import { Module } from '@nestjs/common';
import { PublicRecipeController } from './publicRecipe.controller';
import { PublicRecipeService } from './publicRecipe.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Recipe} from "../recipes/entities/recipe.entity";
import {RecipeIngredient} from "../recipes/entities/recipe-ingredient.entity";
import {RecipeStep} from "../recipes/entities/recipe-step.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Recipe, RecipeIngredient, RecipeStep])],
    controllers: [PublicRecipeController],
    providers: [PublicRecipeService],
    exports: [PublicRecipeService],
})
export class PublicRecipeModule {}

