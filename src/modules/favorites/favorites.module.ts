import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Favorite } from './favorite.entity';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { User } from '../users/user.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import {PublicRecipeModule} from "../publicRecipe/publicRecipe.module";

@Module({
    imports: [TypeOrmModule.forFeature([Favorite, User, Recipe]),
        PublicRecipeModule],
    providers: [FavoritesService],
    controllers: [FavoritesController],
})
export class FavoritesModule {}
