import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import {ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiResponse, ApiParam, ApiBody} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CookflowService } from './cookflow.service';
import { AddToQueueDto } from './dto/add-to-queue.dto';
import { Request } from 'express';
import {MoveToCookedDto} from "./dto/move-to-cooked.dto";
import { PublicRecipeImportDto } from '../publicRecipe/dto/public-recipe-import.dto';

@ApiTags('cookflow')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CookflowController {
    constructor(private readonly service: CookflowService) {}

    private getUserId(req: Request): string {
        const id = (req as any)?.user?.id;
        if (!id) throw new ForbiddenException('Unauthenticated');
        return id;
    }

    @Get('queue')
    @ApiOperation({ 
        summary: 'List queued recipes',
        description: 'Get all recipes in the user\'s cooking queue with full details including ingredients and steps'
    })
    @ApiResponse({ 
        status: 200,
        description: 'Queue retrieved successfully',
        schema: {
            example: [
                {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    title: "Tomato Scrambled Eggs",
                    description: "A classic Chinese home-style dish",
                    image_url: "https://example.com/recipe.jpg",
                    category: "Chinese",
                    difficulty: "Easy",
                    cook_time: "20 minutes",
                    servings: 2,
                    owner: {
                        id: "user-uuid",
                        display_name: "John Doe"
                    },
                    ingredients: [
                        {
                            id: "ing-uuid-1",
                            name: "Tomato",
                            quantity: "2",
                            unit: "pieces",
                            position: 0
                        }
                    ],
                    steps: [
                        {
                            id: "step-uuid-1",
                            step_no: 1,
                            content: "Wash and chop the tomatoes"
                        }
                    ]
                }
            ]
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    listQueue(@Req() req: Request) {
        return this.service.listQueue(this.getUserId(req));
    }

    @Post('queue')
    @ApiOperation({ 
        summary: 'Add a recipe to queue',
        description: 'Add an existing local recipe to the user\'s cooking queue. This operation is idempotent - adding the same recipe twice will not create duplicates.'
    })
    @ApiBody({ type: AddToQueueDto })
    @ApiResponse({ 
        status: 201,
        description: 'Recipe added to queue successfully',
        schema: {
            example: {
                success: true,
                message: "Recipe added to queue"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid recipe ID' })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    @ApiResponse({ status: 404, description: 'Recipe not found' })
    addToQueue(@Req() req: Request, @Body() dto: AddToQueueDto) {
        return this.service.addToQueue(this.getUserId(req), dto.recipeId);
    }

    @Delete('queue/:recipeId')
    @ApiOperation({ 
        summary: 'Remove a recipe from queue',
        description: 'Remove a recipe from the user\'s cooking queue. This operation is idempotent.'
    })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid', description: 'Recipe UUID' })
    @ApiResponse({ 
        status: 200,
        description: 'Recipe removed from queue successfully',
        schema: {
            example: {
                success: true,
                message: "Recipe removed from queue"
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    removeFromQueue(@Req() req: Request, @Param('recipeId', new ParseUUIDPipe()) recipeId: string) {
        return this.service.removeFromQueue(this.getUserId(req), recipeId);
    }

    @Post('queue/move-to-cooked')
    @ApiOperation({ 
        summary: 'Move recipes from queue to cooked',
        description: 'Batch operation to move selected queued recipes to the cooked list, marking them as completed'
    })
    @ApiBody({ type: MoveToCookedDto })
    @ApiResponse({ 
        status: 200,
        description: 'Recipes moved successfully',
        schema: {
            example: {
                success: true,
                moved: 2
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid recipe IDs' })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    moveToCooked(@Req() req: Request, @Body() dto: MoveToCookedDto) {
        return this.service.moveToCooked(this.getUserId(req), dto.recipeIds);
    }

    @Get('cooked')
    @ApiOperation({ 
        summary: 'List cooked recipes',
        description: 'Get all recipes the user has marked as cooked, with full details including ingredients and steps. Results are ordered by cooked date (most recent first).'
    })
    @ApiResponse({ 
        status: 200,
        description: 'Cooked recipes retrieved successfully',
        schema: {
            example: [
                {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    title: "Tomato Scrambled Eggs",
                    description: "A classic Chinese home-style dish",
                    image_url: "https://example.com/recipe.jpg",
                    category: "Chinese",
                    difficulty: "Easy",
                    cook_time: "20 minutes",
                    servings: 2,
                    cooked_at: "2025-10-15T14:30:00.000Z",
                    owner: {
                        id: "user-uuid",
                        display_name: "John Doe"
                    },
                    ingredients: [
                        {
                            id: "ing-uuid-1",
                            name: "Tomato",
                            quantity: "2",
                            unit: "pieces",
                            position: 0
                        }
                    ],
                    steps: [
                        {
                            id: "step-uuid-1",
                            step_no: 1,
                            content: "Wash and chop the tomatoes"
                        }
                    ]
                }
            ]
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    listCooked(@Req() req: Request) {
        return this.service.listCooked(this.getUserId(req));
    }

    @Post('cooked/:recipeId/requeue')
    @ApiOperation({ 
        summary: 'Re-queue a cooked recipe',
        description: 'Move a recipe from the cooked list back to the cooking queue. This is useful when you want to cook the same recipe again.'
    })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid', description: 'Recipe UUID' })
    @ApiResponse({ 
        status: 201,
        description: 'Recipe re-queued successfully',
        schema: {
            example: {
                success: true,
                message: "Recipe re-queued"
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    @ApiResponse({ status: 404, description: 'Recipe not found' })
    requeue(@Req() req: Request, @Param('recipeId', new ParseUUIDPipe()) recipeId: string) {
        return this.service.addToQueue(this.getUserId(req), recipeId);
    }

    @Post('queue/from-public')
    @ApiOperation({ 
        summary: 'Import and queue a public recipe',
        description: 'Import a recipe from external source (Edamam/Spoonacular) to local database and add it directly to the cooking queue in a single operation'
    })
    @ApiBody({ type: PublicRecipeImportDto })
    @ApiResponse({ 
        status: 201,
        description: 'Recipe imported and added to queue successfully',
        schema: {
            example: {
                success: true,
                recipeId: "123e4567-e89b-12d3-a456-426614174000",
                message: "Recipe imported and added to queue"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid import data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    addFromPublic(@Req() req: Request, @Body() dto: PublicRecipeImportDto) {
        return this.service.addFromPublic(this.getUserId(req), dto);
    }
}