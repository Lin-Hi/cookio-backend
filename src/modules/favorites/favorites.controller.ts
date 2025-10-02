import {Controller, Get, Post, Delete, Param, ParseUUIDPipe, Query} from '@nestjs/common';
import {FavoritesService} from './favorites.service';
import {ApiTags, ApiParam, ApiOkResponse, ApiConflictResponse, ApiNotFoundResponse} from '@nestjs/swagger';
import {FavoriteResponseDto, FavoriteCheckDto, FavoriteCountDto} from './dto/favorite-response.dto';

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly service: FavoritesService) {
    }

    @Get(':userId')
    @ApiParam({name: 'userId', type: 'string', format: 'uuid'})
    @ApiOkResponse({type: [FavoriteResponseDto], description: 'List of recipes favorited by user'})
    list(@Param('userId', new ParseUUIDPipe()) userId: string) {
        return this.service.listByUser(userId);
    }

    @Post(':userId/:recipeId')
    @ApiParam({name: 'userId', type: 'string', format: 'uuid'})
    @ApiParam({name: 'recipeId', type: 'string', format: 'uuid'})
    @ApiOkResponse({type: FavoriteResponseDto, description: 'Recipe added to favorites'})
    @ApiConflictResponse({description: 'Recipe already in favorites'})
    add(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.add(userId, recipeId);
    }

    @Delete(':userId/:recipeId')
    @ApiParam({name: 'userId', type: 'string', format: 'uuid'})
    @ApiParam({name: 'recipeId', type: 'string', format: 'uuid'})
    @ApiOkResponse({schema: {example: {deleted: true}}, description: 'Recipe removed from favorites'})
    @ApiNotFoundResponse({description: 'Favorite not found'})
    remove(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.remove(userId, recipeId);
    }

    @Get(':userId/:recipeId')
    @ApiParam({name: 'userId', type: 'string', format: 'uuid'})
    @ApiParam({name: 'recipeId', type: 'string', format: 'uuid'})
    @ApiOkResponse({type: FavoriteCheckDto, description: 'Check if user has favorited a recipe'})
    isFavorite(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.isFavorite(userId, recipeId);
    }

    @Get('recipe/:recipeId/count')
    @ApiParam({name: 'recipeId', type: 'string', format: 'uuid'})
    @ApiOkResponse({type: FavoriteCountDto, description: 'Get number of favorites for a recipe'})
    count(@Param('recipeId', new ParseUUIDPipe()) recipeId: string) {
        return this.service.countFavorites(recipeId);
    }
}
