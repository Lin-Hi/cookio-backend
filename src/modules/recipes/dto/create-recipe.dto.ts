import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class IngredientDto {
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

class StepDto {
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

export class CreateRecipeDto {
    @ApiProperty({ 
        example: '123e4567-e89b-12d3-a456-426614174000', 
        description: 'UUID of the recipe owner' 
    })
    @IsUUID() 
    owner_id!: string;

    @ApiProperty({ 
        example: 'Tomato Scrambled Eggs', 
        description: 'Recipe title' 
    })
    @IsString() @IsNotEmpty() 
    title!: string;

    @ApiProperty({ 
        required: false, 
        example: 'A classic Chinese home-style dish', 
        description: 'Recipe description' 
    })
    @IsOptional() @IsString() 
    description?: string;

    @ApiProperty({ 
        required: false, 
        example: 'https://example.com/recipe.jpg', 
        description: 'Recipe cover image URL' 
    })
    @IsOptional() @IsString() 
    image_url?: string;

    @ApiProperty({ 
        required: false, 
        example: 'Chinese', 
        description: 'Recipe category or cuisine type' 
    })
    @IsOptional() @IsString() 
    category?: string;

    @ApiProperty({ 
        required: false, 
        example: 'Easy', 
        description: 'Difficulty level (e.g., Easy, Medium, Hard)' 
    })
    @IsOptional() @IsString() 
    difficulty?: string;

    @ApiProperty({ 
        required: false, 
        example: '20 minutes', 
        description: 'Estimated cooking time' 
    })
    @IsOptional() @IsString() 
    cook_time?: string;

    @ApiProperty({ 
        required: false, 
        example: 2, 
        description: 'Number of servings' 
    })
    @IsOptional() @IsInt() 
    servings?: number;

    @ApiProperty({ 
        required: false, 
        example: true, 
        description: 'Whether the recipe is publicly visible' 
    })
    @IsOptional() @IsBoolean() 
    is_published?: boolean;

    @ApiProperty({ 
        type: [IngredientDto],
        description: 'List of ingredients',
        example: [
            { name: 'Tomato', quantity: '2', unit: 'pieces', position: 0 },
            { name: 'Egg', quantity: '3', unit: 'pieces', position: 1 }
        ]
    })
    @IsArray() @ValidateNested({ each: true }) @Type(() => IngredientDto)
    ingredients!: IngredientDto[];

    @ApiProperty({ 
        type: [StepDto],
        description: 'Cooking steps',
        example: [
            { step_no: 1, content: 'Wash and chop the tomatoes' },
            { step_no: 2, content: 'Beat the eggs' }
        ]
    })
    @IsArray() @ValidateNested({ each: true }) @Type(() => StepDto)
    steps!: StepDto[];
}
