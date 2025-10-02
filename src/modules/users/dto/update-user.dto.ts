import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    display_name?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    avatar_url?: string;
}
