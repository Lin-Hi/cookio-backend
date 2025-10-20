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
    @ApiProperty({ 
        example: 'Tomato', 
        description: 'Ingredient name' 
    })
    @IsString() @IsNotEmpty()
    name!: string;

    @ApiProperty({ 
        required: false, 
        example: '2', 
        description: 'Quantity of the ingredient' 
    })
    @IsOptional() @IsString()
    quantity?: string;

    @ApiProperty({ 
        required: false, 
        example: 'pieces', 
        description: 'Unit of measurement' 
    })
    @IsOptional() @IsString()
    unit?: string;

    @ApiProperty({ 
        required: false, 
        example: 0, 
        description: 'Display order position' 
    })
    @IsOptional() @IsInt()
    position?: number;
}

class UpdateStepDto {
    @ApiProperty({ 
        example: 1, 
        description: 'Step number' 
    })
    @IsInt()
    step_no!: number;

    @ApiProperty({ 
        example: 'Wash and chop the tomatoes', 
        description: 'Instruction text for this step' 
    })
    @IsString() @IsNotEmpty()
    content!: string;

    @ApiProperty({ 
        required: false, 
        example: 'https://example.com/step1.jpg', 
        description: 'Optional image URL for this step' 
    })
    @IsOptional() @IsString()
    image_url?: string;
}

export class UpdateRecipeDto extends PartialType(CreateRecipeDto) {
    // Override "owner_id": usually not editable; ignore if provided.
    owner_id?: never;

    @ApiProperty({ 
        type: [UpdateIngredientDto], 
        required: false,
        description: 'Updated ingredients list (replaces existing)',
        example: [
            { name: 'Tomato', quantity: '3', unit: 'pieces', position: 0 }
        ]
    })
    @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => UpdateIngredientDto)
    ingredients?: UpdateIngredientDto[];

    @ApiProperty({ 
        type: [UpdateStepDto], 
        required: false,
        description: 'Updated steps list (replaces existing)',
        example: [
            { step_no: 1, content: 'Wash and chop the tomatoes' }
        ]
    })
    @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => UpdateStepDto)
    steps?: UpdateStepDto[];
}
