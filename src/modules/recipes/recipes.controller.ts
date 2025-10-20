import { Controller, Get, Post, Body, Query, Param, ParseUUIDPipe, UseGuards, Request } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {ApiTags, ApiQuery, ApiParam, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody} from '@nestjs/swagger';
import { Put, Delete } from '@nestjs/common';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {IsEnum, IsInt, IsOptional, IsString, IsUUID, Min} from "class-validator";
import {Transform, Type} from "class-transformer";
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {PublicRecipeImportDto} from '../publicRecipe/dto/public-recipe-import.dto';

export enum RecipeSource {
    COMMUNITY = 'community',
    EDAMAM = 'edamam',
    SPOONACULAR = 'spoonacular',
}

//
// Query DTO for GET /recipes; validates and transforms incoming params
//
export class RecipesQueryDto {
    @IsOptional()
    @IsString()
    q?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    difficulty?: string;

    // when provided, only return recipes by this owner (UUID)
    @IsOptional()
    @IsUUID()
    ownerId?: string;

    @IsOptional()
    @IsEnum(RecipeSource)
    source?: RecipeSource; // default set in controller: 'community'

    // parse "true"/"false" (string) into boolean
    @IsOptional()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined;
        if (typeof value === 'boolean') return value;
        return String(value).toLowerCase() === 'true';
    })
    is_published?: boolean;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    pageSize: number = 20;
}

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
    constructor(private readonly service: RecipesService) {}

    @Get()
    @ApiOperation({ 
        summary: 'List recipes with search & pagination',
        description: 'Get a paginated list of recipes with optional filtering by keyword, category, difficulty, owner, source, and publication status'
    })
    @ApiQuery({ name: 'q', required: false, description: 'Keyword search in title and description' })
    @ApiQuery({ name: 'category', required: false, description: 'Filter by recipe category' })
    @ApiQuery({ name: 'difficulty', required: false, description: 'Filter by difficulty level (Easy, Medium, Hard)' })
    @ApiQuery({ name: 'ownerId', required: false, description: 'Filter by owner user ID (UUID)' })
    @ApiQuery({ name: 'source', required: false, enum: RecipeSource, description: 'Recipe source (community, edamam, spoonacular)' })
    @ApiQuery({ name: 'is_published', required: false, description: 'Filter by publication status (true/false)' })
    @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'pageSize', required: false, description: 'Items per page (default: 20)' })
    @ApiResponse({
        status: 200,
        description: 'Recipes retrieved successfully',
        schema: {
            example: {
                items: [
                    {
                        id: "123e4567-e89b-12d3-a456-426614174000",
                        title: "Tomato Scrambled Eggs",
                        description: "A classic Chinese home-style dish",
                        image_url: "https://example.com/recipe.jpg",
                        category: "Chinese",
                        difficulty: "Easy",
                        cook_time: "20 minutes",
                        servings: 2,
                        is_published: true,
                        source: "community",
                        created_at: "2025-10-01T10:00:00.000Z",
                        updated_at: "2025-10-01T10:00:00.000Z",
                        owner: {
                            id: "123e4567-e89b-12d3-a456-426614174000",
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
                ],
                total: 50,
                page: 1,
                pageSize: 20
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid query parameters' })
    findAll(@Query() query: RecipesQueryDto) {
        // default to local community recipes
        if (!query.source) {
            query.source = RecipeSource.COMMUNITY;
        }

        // if browsing community without owner filter and no explicit is_published,
        // return only public recipes by default
        if (
            query.source === RecipeSource.COMMUNITY &&
            !query.ownerId &&
            typeof query.is_published === 'undefined'
        ) {
            query.is_published = true;
        }

        return this.service.findAll({
            q: query.q,
            category: query.category,
            difficulty: query.difficulty,
            ownerId: query.ownerId,
            source: query.source,          // 'community' | 'edamam' | 'spoonacular'
            is_published: query.is_published,
            page: query.page,
            pageSize: query.pageSize,
        });
    }

    @Get(':id')
    @ApiOperation({ 
        summary: 'Get recipe by ID',
        description: 'Retrieve detailed information about a specific recipe including ingredients, steps, and rating summary'
    })
    @ApiParam({ name: 'id', type: 'string', required: true, description: 'Recipe UUID' })
    @ApiResponse({
        status: 200,
        description: 'Recipe retrieved successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                title: "Tomato Scrambled Eggs",
                description: "A classic Chinese home-style dish",
                image_url: "https://example.com/recipe.jpg",
                category: "Chinese",
                difficulty: "Easy",
                cook_time: "20 minutes",
                servings: 2,
                is_published: true,
                source: "community",
                author: "Chef Wang",
                created_at: "2025-10-01T10:00:00.000Z",
                updated_at: "2025-10-01T10:00:00.000Z",
                owner: {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    email: "user@example.com",
                    display_name: "John Doe"
                },
                ingredients: [
                    {
                        id: "ing-uuid-1",
                        name: "Tomato",
                        quantity: "2",
                        unit: "pieces",
                        position: 0
                    },
                    {
                        id: "ing-uuid-2",
                        name: "Egg",
                        quantity: "3",
                        unit: "pieces",
                        position: 1
                    }
                ],
                steps: [
                    {
                        id: "step-uuid-1",
                        step_no: 1,
                        content: "Wash and chop the tomatoes",
                        image_url: null
                    },
                    {
                        id: "step-uuid-2",
                        step_no: 2,
                        content: "Beat the eggs",
                        image_url: null
                    }
                ],
                ratingSummary: {
                    average: 4.5,
                    count: 10
                }
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Recipe not found' })
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.findOne(id);
    }

    @Post()
    @ApiOperation({ 
        summary: 'Create a new recipe',
        description: 'Create a new recipe with ingredients and cooking steps'
    })
    @ApiBody({ type: CreateRecipeDto })
    @ApiResponse({
        status: 201,
        description: 'Recipe created successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                title: "Tomato Scrambled Eggs",
                description: "A classic Chinese home-style dish",
                image_url: "https://example.com/recipe.jpg",
                category: "Chinese",
                difficulty: "Easy",
                cook_time: "20 minutes",
                servings: 2,
                is_published: true,
                source: "community",
                created_at: "2025-10-01T10:00:00.000Z",
                updated_at: "2025-10-01T10:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    create(@Body() dto: CreateRecipeDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    @ApiOperation({ 
        summary: 'Update a recipe',
        description: 'Update recipe details, ingredients, or steps. If ingredients/steps are provided, they will replace all existing ones.'
    })
    @ApiParam({ name: 'id', type: 'string', required: true, description: 'Recipe UUID' })
    @ApiBody({ type: UpdateRecipeDto })
    @ApiResponse({
        status: 200,
        description: 'Recipe updated successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                title: "Tomato Scrambled Eggs (Updated)",
                description: "A classic Chinese home-style dish",
                image_url: "https://example.com/recipe.jpg",
                category: "Chinese",
                difficulty: "Easy",
                cook_time: "20 minutes",
                servings: 2,
                is_published: true,
                updated_at: "2025-10-01T12:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 404, description: 'Recipe not found' })
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateRecipeDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ 
        summary: 'Delete a recipe',
        description: 'Permanently delete a recipe and all its ingredients and steps'
    })
    @ApiParam({ name: 'id', type: 'string', required: true, description: 'Recipe UUID' })
    @ApiResponse({
        status: 200,
        description: 'Recipe deleted successfully',
        schema: {
            example: {
                deleted: true
            }
        }
    })
    @ApiResponse({ status: 404, description: 'Recipe not found' })
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.remove(id);
    }

    @Post('import-from-public')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Import a public recipe without adding to favorites',
        description: 'Imports a recipe from public sources (Edamam/Spoonacular) to local database without adding it to user favorites'
    })
    @ApiBody({ type: PublicRecipeImportDto })
    @ApiResponse({
        status: 201,
        description: 'Recipe imported successfully',
        schema: {
            example: {
                recipe: {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    title: "Chicken Adobo",
                    description: "Filipino chicken dish",
                    source: "edamam",
                    sourceId: "recipe_abc123",
                    sourceUrl: "https://example.com/recipe/123",
                    image_url: "https://example.com/image.jpg",
                    category: "Filipino",
                    difficulty: "Medium",
                    cook_time: "45 minutes",
                    servings: 4,
                    author: "Chef Maria",
                    is_published: false,
                    created_at: "2025-10-01T10:00:00.000Z"
                },
                created: true
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid import data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    @ApiResponse({ status: 409, description: 'Recipe already exists' })
    importFromPublic(@Body() dto: PublicRecipeImportDto, @Request() req: any) {
        const userId = req.user.sub;
        return this.service.importFromPublic(dto, userId);
    }
}
