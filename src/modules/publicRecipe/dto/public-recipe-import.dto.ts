import { IsEnum, IsString, IsOptional, IsUrl, IsArray, ValidateNested, IsInt, Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportIngredientDto {
    @ApiProperty({ example: '番茄' })
    @IsString() name!: string;
    
    @ApiPropertyOptional({ example: '2' })
    @IsOptional() @IsString() quantity?: string;
    
    @ApiPropertyOptional({ example: '个' })
    @IsOptional() @IsString() unit?: string;
}

export class ImportStepDto {
    @ApiProperty({ example: 1 })
    @IsInt() @Min(1) number!: number;
    
    @ApiProperty({ example: '将番茄洗净切块' })
    @IsString() instruction!: string;
}

export class PublicRecipeImportDto {
    @ApiProperty({ enum: ['edamam', 'spoonacular'], example: 'edamam' })
    @IsEnum(['edamam', 'spoonacular'] as any) source!: 'edamam' | 'spoonacular';
    
    @ApiProperty({ example: 'recipe_abc123' })
    @IsString() sourceId!: string;

    @ApiProperty({ example: '番茄炒蛋' })
    @IsString() title!: string;
    
    @ApiPropertyOptional({ example: '经典的家常菜' })
    @IsOptional() @IsString() description?: string;

    @ApiPropertyOptional({ example: 'https://example.com/recipe/123' })
    @IsOptional() @IsUrl() recipeUrl?: string;
    
    @ApiPropertyOptional({ example: 'https://example.com/images/recipe.jpg' })
    @IsOptional() @IsUrl() imageUrl?: string;

    // Recipe metadata
    @ApiPropertyOptional({ example: 'Chinese', description: '菜谱分类/菜系' })
    @IsOptional() @IsString() category?: string;
    
    @ApiPropertyOptional({ example: 'Easy', description: '难度：Easy, Medium, Hard' })
    @IsOptional() @IsString() difficulty?: string;
    
    @ApiPropertyOptional({ example: '30分钟', description: '烹饪时间' })
    @IsOptional() @IsString() cookTime?: string;
    
    @ApiPropertyOptional({ example: 4, description: '份数' })
    @IsOptional() @IsNumber() servings?: number;

    @ApiPropertyOptional({ example: 'Chef Wang', description: '原始作者名称' })
    @IsOptional() @IsString() author?: string;

    @ApiProperty({ type: [ImportIngredientDto] })
    @IsArray() @ValidateNested({ each: true }) @Type(() => ImportIngredientDto)
    ingredients!: ImportIngredientDto[];

    @ApiProperty({ type: [ImportStepDto] })
    @IsArray() @ValidateNested({ each: true }) @Type(() => ImportStepDto)
    steps!: ImportStepDto[];

    @ApiPropertyOptional({ description: '额外的源数据（calories, dietLabels, healthLabels等）' })
    @IsOptional() sourceData?: any;
}
