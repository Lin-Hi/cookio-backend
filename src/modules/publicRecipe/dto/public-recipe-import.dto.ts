import { IsEnum, IsString, IsOptional, IsUrl, IsArray, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ImportIngredientDto {
    @IsString() name!: string;
    @IsOptional() @IsString() quantity?: string;
    @IsOptional() @IsString() unit?: string;
}

export class ImportStepDto {
    @IsInt() @Min(1) number!: number;
    @IsString() instruction!: string;
}

export class PublicRecipeImportDto {
    @IsEnum(['edamam', 'spoonacular'] as any) source!: 'edamam' | 'spoonacular';
    @IsString() sourceId!: string;

    @IsString() title!: string;
    @IsOptional() @IsString() description?: string;

    @IsOptional() @IsUrl() recipeUrl?: string;
    @IsOptional() @IsUrl() imageUrl?: string;

    @IsArray() @ValidateNested({ each: true }) @Type(() => ImportIngredientDto)
    ingredients!: ImportIngredientDto[];

    @IsArray() @ValidateNested({ each: true }) @Type(() => ImportStepDto)
    steps!: ImportStepDto[];

    @IsOptional() sourceData?: any;
}
