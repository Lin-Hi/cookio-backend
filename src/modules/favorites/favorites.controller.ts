import { Controller, Get, Post, Delete, Param, ParseUUIDPipe, Query, Body } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ApiTags, ApiParam, ApiOkResponse, ApiConflictResponse, ApiNotFoundResponse, ApiQuery } from '@nestjs/swagger';
import { FavoriteResponseDto, FavoriteCheckDto, FavoriteCountDto } from './dto/favorite-response.dto';
import { PublicRecipeImportDto } from '../publicRecipe/dto/public-recipe-import.dto';

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly service: FavoritesService) {}

    // Declare static routes first to avoid being captured by parameterized routes.
    @Get('recipe/:recipeId/count')
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid' })
    @ApiOkResponse({ type: FavoriteCountDto, description: 'Get how many users have favorited a recipe' })
    count(@Param('recipeId', new ParseUUIDPipe()) recipeId: string) {
        return this.service.countFavorites(recipeId);
    }

    // Check favorite status by external provider and id.
    // Used when opening a modal for a public recipe (Edamam/Spoonacular).
    @Get('public/:source/:sourceId')
    @ApiParam({ name: 'source', type: 'string', example: 'edamam' })
    @ApiParam({ name: 'sourceId', type: 'string', example: 'external-id-or-uri-hash' })
    @ApiOkResponse({ type: FavoriteCheckDto, description: 'Check if a public recipe (by source/sourceId) is favorited' })
    isFavoriteByExternal(
        @Param('source') source: 'edamam' | 'spoonacular',
        @Param('sourceId') sourceId: string,
    ) {
        return this.service.isFavoriteByExternal(source, sourceId);
    }

    // List current user's favorite recipes (paginated).
    @Get(':userId')
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiOkResponse({ type: [FavoriteResponseDto], description: 'List of recipes favorited by the user' })
    list(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 10,
    ) {
        return this.service.listByUser(userId, page, limit);
    }

    // Import a public recipe (idempotent) and add it to favorites in a single call.
    @Post(':userId/from-public')
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
    @ApiOkResponse({ type: FavoriteResponseDto, description: 'Public recipe imported (if needed) and added to favorites' })
    addFromPublic(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Body() dto: PublicRecipeImportDto,
    ) {
        return this.service.addFromPublic(userId, dto);
    }

    // Add a local recipe to favorites.
    @Post(':userId/:recipeId')
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid' })
    @ApiOkResponse({ type: FavoriteResponseDto, description: 'Recipe added to favorites' })
    @ApiConflictResponse({ description: 'Recipe already in favorites' })
    add(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.add(userId, recipeId);
    }

    // Remove a local recipe from favorites.
    @Delete(':userId/:recipeId')
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid' })
    @ApiOkResponse({ schema: { example: { deleted: true } }, description: 'Recipe removed from favorites' })
    @ApiNotFoundResponse({ description: 'Favorite not found' })
    remove(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.remove(userId, recipeId);
    }

    // Check if the user has favorited a local recipe.
    @Get(':userId/:recipeId')
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid' })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid' })
    @ApiOkResponse({ type: FavoriteCheckDto, description: 'Check if user has favorited a local recipe' })
    isFavorite(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.isFavorite(userId, recipeId);
    }
}
