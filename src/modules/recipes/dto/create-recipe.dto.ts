import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class IngredientDto {
    @ApiProperty() @IsString() @IsNotEmpty() name!: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() quantity?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() unit?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsInt() position?: number;
}

class StepDto {
    @ApiProperty() @IsInt() step_no!: number;
    @ApiProperty() @IsString() @IsNotEmpty() content!: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() image_url?: string;
}

export class CreateRecipeDto {
    @ApiProperty() @IsUUID() owner_id!: string;
    @ApiProperty() @IsString() @IsNotEmpty() title!: string;

    @ApiProperty({ required: false }) @IsOptional() @IsString() description?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() image_url?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() category?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() difficulty?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() cook_time?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsInt() servings?: number;
    @ApiProperty({ required: false }) @IsOptional() @IsBoolean() is_published?: boolean;

    @ApiProperty({ type: [IngredientDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => IngredientDto)
    ingredients!: IngredientDto[];

    @ApiProperty({ type: [StepDto] }) @IsArray() @ValidateNested({ each: true }) @Type(() => StepDto)
    steps!: StepDto[];
}
