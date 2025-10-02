import { ApiProperty } from '@nestjs/swagger';

export class FavoriteResponseDto {
    @ApiProperty({ example: 'uuid-of-recipe' })
    recipeId!: string;

    @ApiProperty({ example: 'Tomato Pasta' })
    title!: string;

    @ApiProperty({ example: '2025-10-02T12:00:00Z' })
    favoritedAt!: Date;
}

export class FavoriteCheckDto {
    @ApiProperty({ example: true })
    isFavorite!: boolean;
}

export class FavoriteCountDto {
    @ApiProperty({ example: 'uuid-of-recipe' })
    recipeId!: string;

    @ApiProperty({ example: 42 })
    count!: number;
}
