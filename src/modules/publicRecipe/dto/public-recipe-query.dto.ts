import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PublicRecipeQueryDto {
    @ApiPropertyOptional({ description: 'Search keywords, e.g. "chicken"' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ description: 'Meal type', enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Teatime'] })
    @IsOptional()
    @IsString()
    mealType?: string;

    @ApiPropertyOptional({ description: 'Cuisine type', enum: ['American', 'Asian', 'British', 'Chinese', 'French', 'Indian', 'Italian', 'Japanese', 'Korean', 'Mediterranean', 'Mexican'] })
    @IsOptional()
    @IsString()
    cuisineType?: string;

    @ApiPropertyOptional({ description: 'Dish type', enum: ['Main course', 'Side dish', 'Desserts', 'Soup', 'Salad', 'Bread', 'Drinks'] })
    @IsOptional()
    @IsString()
    dishType?: string;

    @ApiPropertyOptional({ description: 'Health labels', enum: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'low-carb', 'low-fat'] })
    @IsOptional()
    @IsString()
    health?: string;

    @ApiPropertyOptional({ description: 'Diet labels', enum: ['balanced', 'high-fiber', 'high-protein', 'low-carb', 'low-fat', 'low-sodium'] })
    @IsOptional()
    @IsString()
    diet?: string;

    @ApiPropertyOptional({ description: 'Page number', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize?: number = 20;
}

