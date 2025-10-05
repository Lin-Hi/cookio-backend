import { IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePantryItemDto {
    @ApiProperty({ maxLength: 150, example: 'Tomato' })
    @IsString() @MaxLength(150)
    name!: string;

    @ApiPropertyOptional({ maxLength: 80, example: '2' })
    @IsOptional() @IsString() @MaxLength(80)
    quantity?: string;

    @ApiPropertyOptional({ maxLength: 40, example: 'pcs' })
    @IsOptional() @IsString() @MaxLength(40)
    unit?: string;

    @ApiPropertyOptional({ format: 'date', example: '2025-10-31' })
    @IsOptional() @IsDateString()
    expiresAt?: string; // ISO date
}
