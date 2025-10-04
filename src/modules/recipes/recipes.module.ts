import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { Recipe } from './entities/recipe.entity';
import { RecipeIngredient } from './entities/recipe-ingredient.entity';
import { RecipeStep } from './entities/recipe-step.entity';
import { User } from '../users/user.entity';
import {ReviewsModule} from "../reviews/reviews.module";

@Module({
    imports: [TypeOrmModule.forFeature([Recipe, RecipeIngredient, RecipeStep, User]),ReviewsModule],
    controllers: [RecipesController],
    providers: [RecipesService],
    exports: [RecipesService]
})
export class RecipesModule {}
