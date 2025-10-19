import { ApiProperty } from '@nestjs/swagger';

export class UserStatsDto {
    @ApiProperty({ 
        description: 'Number of recipes created by the user',
        example: 12
    })
    recipesCreated!: number;

    @ApiProperty({ 
        description: 'Number of recipes favorited by the user',
        example: 45
    })
    recipesFavorited!: number;

    @ApiProperty({ 
        description: 'Number of recipes cooked by the user',
        example: 28
    })
    recipesCooked!: number;

    @ApiProperty({ 
        description: 'Number of recipes in user\'s queue',
        example: 5
    })
    recipesInQueue!: number;
}
