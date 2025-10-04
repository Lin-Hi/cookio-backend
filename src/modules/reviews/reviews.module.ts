import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecipeReview } from './review.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Recipe } from '../recipes/entities/recipe.entity';
import { User } from '../users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([RecipeReview, Recipe, User])],
    providers: [ReviewsService],
    controllers: [ReviewsController],
    exports: [ReviewsService],
})
export class ReviewsModule {}
