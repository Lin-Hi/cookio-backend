import {Controller, Get, Query, HttpException, HttpStatus, UseGuards, Post, Body, Req, Param} from '@nestjs/common';
import {ApiTags, ApiQuery, ApiOperation, ApiBearerAuth} from '@nestjs/swagger';
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
    @ApiOperation({summary: 'Search public recipes', description: 'Search public recipes from Edamam API'})
    @ApiQuery({name: 'q', required: false, description: 'Search keywords, e.g. "chicken"'})
    @ApiQuery({name: 'mealType', required: false, description: 'Meal type'})
    @ApiQuery({name: 'cuisineType', required: false, description: 'Cuisine type'})
    @ApiQuery({name: 'dishType', required: false, description: 'Dish type'})
    @ApiQuery({name: 'health', required: false, description: 'Health labels'})
    @ApiQuery({name: 'diet', required: false, description: 'Diet labels'})
    @ApiQuery({name: 'page', required: false, description: 'Page number, default 1'})
    @ApiQuery({name: 'pageSize', required: false, description: 'Items per page, default 20'})
    searchPublicRecipes(@Query() query: PublicRecipeQueryDto) {
        return this.publicRecipeService.searchPublicRecipes(query);
    }

    @Get('steps')
    @ApiOperation({
        summary: 'Get recipe steps',
        description: 'Extract recipe steps from Spoonacular API for specified URL'
    })
    @ApiQuery({
        name: 'recipeUrl',
        required: true,
        description: 'Original recipe URL, e.g. "https://www.seriouseats.com/chicken-recipe"'
    })
    @ApiQuery({
        name: 'recipeId',
        required: false,
        description: 'Recipe ID (optional)'
    })
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
    @ApiOperation({summary: 'Import public recipe into local database'})
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
    @ApiOperation({summary: 'Asynchronously fetch and update recipe steps'})
    async fetchSteps(@Param('recipeId') recipeId: string) {
        if (!recipeId) {
            throw new HttpException('recipeId is required', HttpStatus.BAD_REQUEST);
        }
        const result = await this.publicRecipeService.fetchAndUpdateSteps(recipeId);
        return result;
    }

    @ApiBearerAuth()
    @Post(':recipeId/save-steps')
    @ApiOperation({summary: 'Directly save step data'})
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

