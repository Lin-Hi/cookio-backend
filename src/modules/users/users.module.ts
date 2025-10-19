import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { Favorite } from '../favorites/favorite.entity';
import { QueueItem } from '../cookflow/queue-item.entity';
import { CookedRecipe } from '../cookflow/cooked-recipe.entity';
import {RecipesModule} from "../recipes/recipes.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Recipe, Favorite, QueueItem, CookedRecipe]),
        RecipesModule],
    controllers: [UsersController],
    providers: [UsersService],
    exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
