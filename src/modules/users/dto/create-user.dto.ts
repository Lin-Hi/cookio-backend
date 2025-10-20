import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'someone@example.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'password123', minLength: 6 })
    @IsString()
    @MinLength(6, { message: 'Password must be at least 6 characters long' })
    password!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    display_name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    avatar_url?: string;
}
