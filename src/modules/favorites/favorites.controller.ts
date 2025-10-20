import { Controller, Get, Post, Delete, Param, ParseUUIDPipe, Query, Body } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ApiTags, ApiParam, ApiOkResponse, ApiConflictResponse, ApiNotFoundResponse, ApiQuery, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { FavoriteResponseDto, FavoriteCheckDto, FavoriteCountDto } from './dto/favorite-response.dto';
import { PublicRecipeImportDto } from '../publicRecipe/dto/public-recipe-import.dto';

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly service: FavoritesService) {}

    // Declare static routes first to avoid being captured by parameterized routes.
    @Get('recipe/:recipeId/count')
    @ApiOperation({ 
        summary: 'Get favorite count for a recipe',
        description: 'Returns the total number of users who have favorited this recipe'
    })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid', description: 'Recipe UUID' })
    @ApiResponse({ 
        status: 200, 
        type: FavoriteCountDto,
        description: 'Favorite count retrieved successfully',
        schema: {
            example: {
                recipeId: "123e4567-e89b-12d3-a456-426614174000",
                count: 42
            }
        }
    })
    count(@Param('recipeId', new ParseUUIDPipe()) recipeId: string) {
        return this.service.countFavorites(recipeId);
    }

    // Check favorite status by external provider and id.
    // Used when opening a modal for a public recipe (Edamam/Spoonacular).
    @Get('public/:source/:sourceId')
    @ApiOperation({ 
        summary: 'Check if a public recipe is favorited',
        description: 'Check if a recipe from external source (Edamam/Spoonacular) has been favorited by any user'
    })
    @ApiParam({ name: 'source', type: 'string', enum: ['edamam', 'spoonacular'], example: 'edamam', description: 'Recipe source provider' })
    @ApiParam({ name: 'sourceId', type: 'string', example: 'recipe_abc123', description: 'External recipe ID or URI hash' })
    @ApiResponse({ 
        status: 200,
        type: FavoriteCheckDto,
        description: 'Favorite status retrieved successfully',
        schema: {
            example: {
                isFavorite: true
            }
        }
    })
    isFavoriteByExternal(
        @Param('source') source: 'edamam' | 'spoonacular',
        @Param('sourceId') sourceId: string,
    ) {
        return this.service.isFavoriteByExternal(source, sourceId);
    }

    // Get full local recipe data (including steps) by external source/sourceId
    // Used to avoid calling external API when recipe is already imported
    @Get('public/:source/:sourceId/recipe')
    @ApiOperation({ 
        summary: 'Get local recipe data by external ID',
        description: 'Retrieve full recipe data (including ingredients and steps) if the external recipe has been imported locally'
    })
    @ApiParam({ name: 'source', type: 'string', enum: ['edamam', 'spoonacular'], example: 'edamam', description: 'Recipe source provider' })
    @ApiParam({ name: 'sourceId', type: 'string', example: 'recipe_abc123', description: 'External recipe ID or URI hash' })
    @ApiResponse({
        status: 200,
        description: 'Recipe data retrieved successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                title: "Chicken Adobo",
                description: "Filipino chicken dish",
                source: "edamam",
                sourceId: "recipe_abc123",
                ingredients: [
                    {
                        id: "ing-uuid-1",
                        name: "Chicken",
                        quantity: "500",
                        unit: "g",
                        position: 0
                    }
                ],
                steps: [
                    {
                        id: "step-uuid-1",
                        step_no: 1,
                        content: "Marinate the chicken"
                    }
                ]
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Recipe not imported locally yet' })
    getLocalRecipeByExternal(
        @Param('source') source: 'edamam' | 'spoonacular',
        @Param('sourceId') sourceId: string,
    ) {
        return this.service.getLocalRecipeByExternal(source, sourceId);
    }

    // List current user's favorite recipes (paginated).
    @Get(':userId')
    @ApiOperation({ 
        summary: 'List user\'s favorite recipes',
        description: 'Get a paginated list of recipes favorited by a specific user'
    })
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 20, description: 'Items per page (default: 20)' })
    @ApiResponse({ 
        status: 200,
        description: 'Favorites list retrieved successfully',
        schema: {
            example: {
                items: [
                    {
                        recipeId: "123e4567-e89b-12d3-a456-426614174000",
                        title: "Tomato Pasta",
                        favoritedAt: "2025-10-02T12:00:00.000Z"
                    }
                ],
                total: 15,
                page: 1,
                limit: 20
            }
        }
    })
    list(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Query('page') page = 1,
        @Query('limit') limit = 20,
    ) {
        return this.service.listByUser(userId, page, limit);
    }

    // Import a public recipe (idempotent) and add it to favorites in a single call.
    @Post(':userId/from-public')
    @ApiOperation({ 
        summary: 'Import and favorite a public recipe',
        description: 'Import a recipe from external source (Edamam/Spoonacular) to local database and add it to user favorites in a single operation. This is idempotent - if recipe already exists, it will just be added to favorites.'
    })
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiBody({ type: PublicRecipeImportDto })
    @ApiResponse({ 
        status: 201,
        type: FavoriteResponseDto,
        description: 'Recipe imported and added to favorites successfully',
        schema: {
            example: {
                recipeId: "123e4567-e89b-12d3-a456-426614174000",
                title: "Chicken Adobo",
                favoritedAt: "2025-10-02T12:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid import data' })
    @ApiResponse({ status: 409, description: 'Recipe already in favorites' })
    addFromPublic(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Body() dto: PublicRecipeImportDto,
    ) {
        return this.service.addFromPublic(userId, dto);
    }

    // Add a local recipe to favorites.
    @Post(':userId/:recipeId')
    @ApiOperation({ 
        summary: 'Add a recipe to favorites',
        description: 'Add an existing local recipe to user\'s favorites'
    })
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid', description: 'Recipe UUID' })
    @ApiResponse({ 
        status: 201,
        type: FavoriteResponseDto,
        description: 'Recipe added to favorites successfully',
        schema: {
            example: {
                recipeId: "123e4567-e89b-12d3-a456-426614174000",
                title: "Tomato Pasta",
                favoritedAt: "2025-10-02T12:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 409, description: 'Recipe already in favorites' })
    @ApiResponse({ status: 404, description: 'Recipe or user not found' })
    add(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.add(userId, recipeId);
    }

    // Remove a local recipe from favorites.
    @Delete(':userId/:recipeId')
    @ApiOperation({ 
        summary: 'Remove a recipe from favorites',
        description: 'Remove a recipe from user\'s favorites list'
    })
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid', description: 'Recipe UUID' })
    @ApiResponse({ 
        status: 200,
        description: 'Recipe removed from favorites successfully',
        schema: { 
            example: { 
                deleted: true 
            } 
        } 
    })
    @ApiResponse({ status: 404, description: 'Favorite not found' })
    remove(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.remove(userId, recipeId);
    }

    // Check if the user has favorited a local recipe.
    @Get(':userId/:recipeId')
    @ApiOperation({ 
        summary: 'Check if recipe is favorited',
        description: 'Check if a specific user has favorited a specific local recipe'
    })
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid', description: 'Recipe UUID' })
    @ApiResponse({ 
        status: 200,
        type: FavoriteCheckDto,
        description: 'Favorite status retrieved successfully',
        schema: {
            example: {
                isFavorite: true
            }
        }
    })
    isFavorite(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.isFavorite(userId, recipeId);
    }
}
