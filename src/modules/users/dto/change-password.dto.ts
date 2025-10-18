import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class ChangePasswordDto {
    @ApiProperty({ 
        description: 'Current password',
        example: 'currentPassword123'
    })
    @IsString()
    currentPassword!: string;

    @ApiProperty({ 
        description: 'New password',
        example: 'newPassword123',
        minLength: 8,
        maxLength: 20
    })
    @IsString()
    @MinLength(8, { message: 'Password must be at least 8 characters' })
    @MaxLength(20, { message: 'Password must be less than 20 characters' })
    @Matches(/^[a-zA-Z0-9]+$/, { message: 'Password can only contain English letters and numbers' })
    newPassword!: string;
}
