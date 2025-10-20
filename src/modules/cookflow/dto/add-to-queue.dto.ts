import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToQueueDto {
    @ApiProperty({ 
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'Recipe UUID to add to queue'
    })
    @IsUUID()
    recipeId!: string;
}
