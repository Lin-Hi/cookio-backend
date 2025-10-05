import { IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';

export class CreatePantryItemDto {
    @IsString() @MaxLength(150)
    name!: string;

    @IsOptional() @IsString() @MaxLength(80)
    quantity?: string;

    @IsOptional() @IsString() @MaxLength(40)
    unit?: string;

    @IsOptional() @IsDateString()
    expiresAt?: string; // ISO date
}
