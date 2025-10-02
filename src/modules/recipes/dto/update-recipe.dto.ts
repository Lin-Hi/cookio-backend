import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateRecipeDto } from './create-recipe.dto';
import { IsArray, IsOptional, ValidateNested, IsInt, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

// UpdateRecipeDto: partial update for a recipe.
// Strategy: basic fields are optional;
// if "ingredients"/"steps" are provided, we will REPLACE all existing ones
// in a single transaction (delete + bulk insert).

// Re-declare child DTOs because PartialType(CreateRecipeDto) would make
// children optional but also keep them nested-validated when provided.
class UpdateIngredientDto {
    @ApiProperty() @IsString() @IsNotEmpty()
    name!: string;

    @ApiProperty({ required: false }) @IsOptional() @IsString()
    quantity?: string;

    @ApiProperty({ required: false }) @IsOptional() @IsString()
    unit?: string;

    @ApiProperty({ required: false }) @IsOptional() @IsInt()
    position?: number;
}

class UpdateStepDto {
    @ApiProperty() @IsInt()
    step_no!: number;

    @ApiProperty() @IsString() @IsNotEmpty()
    content!: string;

    @ApiProperty({ required: false }) @IsOptional() @IsString()
    image_url?: string;
}

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {
    // Override "owner_id": usually not editable; ignore if provided.
    owner_id?: never;

    @ApiProperty({ type: [UpdateIngredientDto], required: false })
    @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => UpdateIngredientDto)
    ingredients?: UpdateIngredientDto[];

    @ApiProperty({ type: [UpdateStepDto], required: false })
    @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => UpdateStepDto)
    steps?: UpdateStepDto[];
}
