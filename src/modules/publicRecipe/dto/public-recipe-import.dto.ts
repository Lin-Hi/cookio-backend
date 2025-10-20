import { IsEnum, IsString, IsOptional, IsUrl, IsArray, ValidateNested, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportIngredientDto {
    @ApiProperty({ example: 'Tomato' })
    @IsString() name!: string;
    
    @ApiPropertyOptional({ example: '2' })
    @IsOptional() @IsString() quantity?: string;
    
    @ApiPropertyOptional({ example: 'pieces' })
    @IsOptional() @IsString() unit?: string;
}

export class ImportStepDto {
    @ApiProperty({ example: 1 })
    @IsInt() @Min(1) number!: number;
    
    @ApiProperty({ example: 'Wash and cut tomatoes into pieces' })
    @IsString() instruction!: string;
}

export class PublicRecipeImportDto {
    @ApiProperty({ enum: ['edamam', 'spoonacular'], example: 'edamam' })
    @IsEnum(['edamam', 'spoonacular'] as any) source!: 'edamam' | 'spoonacular';
    
    @ApiProperty({ example: 'recipe_abc123' })
    @IsString() sourceId!: string;

    @ApiProperty({ example: 'Scrambled Eggs with Tomatoes' })
    @IsString() title!: string;
    
    @ApiPropertyOptional({ example: 'Classic home-style dish' })
    @IsOptional() @IsString() description?: string;

    @ApiPropertyOptional({ example: 'https://example.com/recipe/123' })
    @IsOptional() @IsUrl() recipeUrl?: string;
    
    @ApiPropertyOptional({ example: 'https://example.com/images/recipe.jpg' })
    @IsOptional() @IsUrl() imageUrl?: string;

    // Recipe metadata
    @ApiPropertyOptional({ example: 'Chinese', description: 'Recipe category/cuisine' })
    @IsOptional() @IsString() category?: string;
    
    @ApiPropertyOptional({ example: 'Easy', description: 'Difficulty: Easy, Medium, Hard' })
    @IsOptional() @IsString() difficulty?: string;
    
    @ApiPropertyOptional({ example: '30 minutes', description: 'Cooking time' })
    @IsOptional() @IsString() cookTime?: string;
    
    @ApiPropertyOptional({ example: 4, description: 'Servings' })
    @IsOptional() @IsNumber() servings?: number;

    @ApiPropertyOptional({ example: 'Chef Wang', description: 'Original author name' })
    @IsOptional() @IsString() author?: string;

    @ApiProperty({ type: [ImportIngredientDto] })
    @IsArray() @ValidateNested({ each: true }) @Type(() => ImportIngredientDto)
    ingredients!: ImportIngredientDto[];

    @ApiPropertyOptional({ type: [ImportStepDto] })
    @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ImportStepDto)
    steps?: ImportStepDto[];

    @ApiPropertyOptional({ description: 'Additional source data (calories, dietLabels, healthLabels, etc.)' })
    @IsOptional() sourceData?: any;
}
