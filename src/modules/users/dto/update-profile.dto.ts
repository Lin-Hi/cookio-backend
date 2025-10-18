import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @ApiProperty({ 
        required: false, 
        description: 'User display name',
        example: 'John Doe',
        maxLength: 15
    })
    @IsOptional()
    @IsString()
    @MaxLength(15, { message: 'Display name must be less than 15 characters' })
    display_name?: string;

    @ApiProperty({ 
        required: false, 
        description: 'User bio/description',
        example: 'I love cooking Italian food and experimenting with new recipes!',
        maxLength: 500
    })
    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Bio must be less than 500 characters' })
    bio?: string;

    @ApiProperty({ 
        required: false, 
        description: 'User avatar URL',
        example: 'https://example.com/avatar.jpg'
    })
    @IsOptional()
    @IsString()
    avatar_url?: string;
}
