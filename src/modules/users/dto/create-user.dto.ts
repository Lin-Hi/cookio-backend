import { IsEmail, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty({ example: 'someone@example.com' })
    @IsEmail()
    email!: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    display_name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    avatar_url?: string;
}
