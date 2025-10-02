import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ example: 'password123', minLength: 6 })
    @IsString()
    @MinLength(6, { message: '密码至少需要6个字符' })
    password!: string;

    @ApiProperty({ required: false, example: '张三' })
    @IsOptional()
    @IsString()
    display_name?: string;

    @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
    @IsOptional()
    @IsString()
    avatar_url?: string;
}
