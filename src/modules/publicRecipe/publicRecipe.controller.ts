import {Controller, Get, Query, HttpException, HttpStatus, UseGuards, Post, Body, Req, Param} from '@nestjs/common';
import {ApiTags, ApiQuery, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody, ApiParam} from '@nestjs/swagger';
import {PublicRecipeService} from './publicRecipe.service';
import {PublicRecipeQueryDto} from './dto/public-recipe-query.dto';
import {PublicRecipeImportDto} from "./dto/public-recipe-import.dto";
import {JwtAuthGuard} from "../auth/guards/jwt-auth.guard";

@ApiTags('publicRecipe')
@Controller('publicRecipe')
export class PublicRecipeController {
    constructor(private readonly publicRecipeService: PublicRecipeService) {
    }

    @Get()
    @ApiOperation({
        summary: 'Search public recipes',
        description: 'Search recipes from external APIs (Edamam) with filtering by meal type, cuisine, diet, and health labels'
    })
    @ApiQuery({name: 'q', required: false, description: 'Search keywords (e.g., "chicken", "pasta")', example: 'chicken'})
    @ApiQuery({name: 'mealType', required: false, description: 'Meal type (e.g., Breakfast, Lunch, Dinner)', example: 'Dinner'})
    @ApiQuery({name: 'cuisineType', required: false, description: 'Cuisine type (e.g., Italian, Chinese, Mexican)', example: 'Italian'})
    @ApiQuery({name: 'dishType', required: false, description: 'Dish type (e.g., Main course, Dessert, Appetizer)', example: 'Main course'})
    @ApiQuery({name: 'health', required: false, description: 'Health labels (e.g., vegan, vegetarian, gluten-free)', example: 'vegan'})
    @ApiQuery({name: 'diet', required: false, description: 'Diet labels (e.g., balanced, low-carb, high-protein)', example: 'balanced'})
    @ApiQuery({name: 'page', required: false, description: 'Page number (default: 1)', example: 1, type: Number})
    @ApiQuery({name: 'pageSize', required: false, description: 'Items per page (default: 20, max: 100)', example: 20, type: Number})
    @ApiResponse({
        status: 200,
        description: 'Public recipes retrieved successfully',
        schema: {
            example: {
                recipes: [
                    {
                        id: "recipe_abc123",
                        title: "Chicken Parmesan",
                        description: "Classic Italian chicken dish",
                        image_url: "https://example.com/image.jpg",
                        recipe_url: "https://example.com/recipe/123",
                        source: "edamam",
                        category: "Italian",
                        difficulty: "Medium",
                        cook_time: "45 minutes",
                        servings: 4,
                        calories: 450,
                        ingredients: [
                            {
                                name: "Chicken breast",
                                quantity: "500",
                                unit: "g"
                            }
                        ],
                        dietLabels: ["Balanced"],
                        healthLabels: ["Sugar-Conscious", "Peanut-Free"],
                        sourceData: {}
                    }
                ],
                total: 150,
                page: 1,
                pageSize: 20
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid query parameters' })
    @ApiResponse({ status: 503, description: 'External API unavailable' })
    searchPublicRecipes(@Query() query: PublicRecipeQueryDto) {
        return this.publicRecipeService.searchPublicRecipes(query);
    }

    @Get('steps')
    @ApiOperation({
        summary: 'Get recipe cooking steps',
        description: 'Extract detailed cooking steps from Spoonacular API for a given recipe URL. Note: Spoonacular API has daily quota limits.'
    })
    @ApiQuery({
        name: 'recipeUrl',
        required: true,
        description: 'Original recipe URL from external source',
        example: 'https://www.seriouseats.com/chicken-recipe'
    })
    @ApiQuery({
        name: 'recipeId',
        required: false,
        description: 'Optional recipe ID for reference',
        example: 'recipe_abc123'
    })
    @ApiResponse({
        status: 200,
        description: 'Steps retrieved successfully',
        schema: {
            example: {
                recipeUrl: "https://www.seriouseats.com/chicken-recipe",
                recipeId: "recipe_abc123",
                steps: [
                    "Wash and chop the tomatoes",
                    "Beat the eggs",
                    "Heat oil in a pan"
                ],
                total: 3
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Missing or invalid recipeUrl parameter' })
    @ApiResponse({ status: 402, description: 'Spoonacular API quota exceeded' })
    @ApiResponse({ status: 503, description: 'External API unavailable' })
    async getRecipeSteps(
        @Query('recipeUrl') recipeUrl: string,
        @Query('recipeId') recipeId?: string
    ) {
        if (!recipeUrl) {
            throw new HttpException('recipeUrl parameter is required', HttpStatus.BAD_REQUEST);
        }

        const steps = await this.publicRecipeService.fetchRecipeSteps(recipeUrl, recipeId);

        return {
            recipeUrl,
            recipeId: recipeId || null,
            steps,
            total: steps.length,
        };
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post('import')
    @ApiOperation({
        summary: 'Import a public recipe',
        description: 'Import a recipe from external source (Edamam/Spoonacular) into local database. This operation is idempotent - importing the same recipe twice will return the existing record.'
    })
    @ApiBody({ type: PublicRecipeImportDto })
    @ApiResponse({
        status: 201,
        description: 'Recipe imported successfully',
        schema: {
            example: {
                recipeId: "123e4567-e89b-12d3-a456-426614174000",
                created: true
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid import data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required or invalid' })
    async importRecipe(@Req() req: any, @Body() dto: PublicRecipeImportDto) {
        const ownerId: string | undefined = req?.user?.id || req?.user?.userId || req?.user?.sub;
        if (!ownerId) {
            throw new HttpException('Unauthorized: missing user id in token', HttpStatus.UNAUTHORIZED);
        }
        const {recipe, created} = await this.publicRecipeService.ensureLocalRecipeFromPublic(dto, ownerId);
        return {recipeId: recipe.id, created};
    }

    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @Post(':recipeId/fetch-steps')
    @ApiOperation({
        summary: 'Fetch and update recipe steps',
        description: 'Asynchronously fetch cooking steps from external API and update the local recipe. Useful for recipes imported without steps.'
    })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid', description: 'Recipe UUID' })
    @ApiResponse({
        status: 200,
        description: 'Steps fetched and updated successfully',
        schema: {
            example: {
                success: true,
                stepsAdded: 5
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Missing or invalid recipeId' })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    @ApiResponse({ status: 404, description: 'Recipe not found' })
    async fetchSteps(@Param('recipeId') recipeId: string) {
        if (!recipeId) {
            throw new HttpException('recipeId is required', HttpStatus.BAD_REQUEST);
        }
        const result = await this.publicRecipeService.fetchAndUpdateSteps(recipeId);
        return result;
    }

    @ApiBearerAuth()
    @Post(':recipeId/save-steps')
    @ApiOperation({
        summary: 'Save recipe steps directly',
        description: 'Directly save an array of cooking steps to a recipe, bypassing external API calls. Useful for manual data entry or batch imports.'
    })
    @ApiParam({ name: 'recipeId', type: 'string', format: 'uuid', description: 'Recipe UUID' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                steps: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            number: { type: 'number', example: 1 },
                            instruction: { type: 'string', example: 'Wash and chop the vegetables' }
                        }
                    },
                    example: [
                        { number: 1, instruction: 'Wash and chop the vegetables' },
                        { number: 2, instruction: 'Heat oil in a pan' }
                    ]
                }
            },
            required: ['steps']
        }
    })
    @ApiResponse({
        status: 201,
        description: 'Steps saved successfully',
        schema: {
            example: {
                success: true,
                stepsSaved: 2
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Missing or invalid recipeId or steps array' })
    @ApiResponse({ status: 404, description: 'Recipe not found' })
    async saveSteps(@Param('recipeId') recipeId: string, @Body() body: { steps: any[] }) {
        if (!recipeId) {
            throw new HttpException('recipeId is required', HttpStatus.BAD_REQUEST);
        }
        if (!body.steps || !Array.isArray(body.steps)) {
            throw new HttpException('steps array is required', HttpStatus.BAD_REQUEST);
        }
        const result = await this.publicRecipeService.saveSteps(recipeId, body.steps);
        return result;
    }
}

