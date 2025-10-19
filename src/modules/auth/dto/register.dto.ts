import {IsEmail, IsString, MinLength, IsOptional, MaxLength, Matches} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'password123', minLength: 8, maxLength: 20 })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(20, { message: 'Password must be less than 20 characters' })
    @Matches(/^[a-zA-Z0-9]+$/, { message: 'Password can only contain English letters and numbers' })
    password!: string;

    @ApiProperty({ required: false, example: 'John Doe' })
    @IsOptional()
    @IsString()
    display_name?: string;

    @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
    @IsOptional()
    @IsString()
    avatar_url?: string;
}
