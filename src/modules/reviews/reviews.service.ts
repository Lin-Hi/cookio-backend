import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecipeReview } from './review.entity';
import { Recipe } from '../recipes/entities/recipe.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectRepository(RecipeReview) private readonly repo: Repository<RecipeReview>,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) {}

}
