import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PublicRecipeQueryDto {
    @ApiPropertyOptional({ description: '搜索关键词，例如 "chicken"' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ description: '菜肴类型', enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Teatime'] })
    @IsOptional()
    @IsString()
    mealType?: string;

    @ApiPropertyOptional({ description: '菜系类型', enum: ['American', 'Asian', 'British', 'Chinese', 'French', 'Indian', 'Italian', 'Japanese', 'Korean', 'Mediterranean', 'Mexican'] })
    @IsOptional()
    @IsString()
    cuisineType?: string;

    @ApiPropertyOptional({ description: '料理类型', enum: ['Main course', 'Side dish', 'Desserts', 'Soup', 'Salad', 'Bread', 'Drinks'] })
    @IsOptional()
    @IsString()
    dishType?: string;

    @ApiPropertyOptional({ description: '健康标签', enum: ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'low-carb', 'low-fat'] })
    @IsOptional()
    @IsString()
    health?: string;

    @ApiPropertyOptional({ description: '饮食标签', enum: ['balanced', 'high-fiber', 'high-protein', 'low-carb', 'low-fat', 'low-sodium'] })
    @IsOptional()
    @IsString()
    diet?: string;

    @ApiPropertyOptional({ description: '页码', default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: '每页数量', default: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    pageSize?: number = 20;
}

