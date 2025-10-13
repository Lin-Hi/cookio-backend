import {Controller, Get, Query, HttpException, HttpStatus, UseGuards, Post, Body, Req} from '@nestjs/common';
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
    @ApiOperation({summary: '搜索公共菜谱', description: '从 Edamam API 搜索公共菜谱'})
    @ApiQuery({name: 'q', required: false, description: '搜索关键词，例如 "chicken"'})
    @ApiQuery({name: 'mealType', required: false, description: '菜肴类型'})
    @ApiQuery({name: 'cuisineType', required: false, description: '菜系类型'})
    @ApiQuery({name: 'dishType', required: false, description: '料理类型'})
    @ApiQuery({name: 'health', required: false, description: '健康标签'})
    @ApiQuery({name: 'diet', required: false, description: '饮食标签'})
    @ApiQuery({name: 'page', required: false, description: '页码，默认 1'})
    @ApiQuery({name: 'pageSize', required: false, description: '每页数量，默认 20'})
    searchPublicRecipes(@Query() query: PublicRecipeQueryDto) {
        return this.publicRecipeService.searchPublicRecipes(query);
    }

    @Get('steps')
    @ApiOperation({
        summary: '获取菜谱步骤',
        description: '从 Spoonacular API 提取指定 URL 的菜谱步骤'
    })
    @ApiQuery({
        name: 'recipeUrl',
        required: true,
        description: '菜谱原始 URL，例如 "https://www.seriouseats.com/chicken-recipe"'
    })
    @ApiQuery({
        name: 'recipeId',
        required: false,
        description: '菜谱 ID（可选）'
    })
    async getRecipeSteps(
        @Query('recipeUrl') recipeUrl: string,
        @Query('recipeId') recipeId?: string
    ) {
        if (!recipeUrl) {
            throw new HttpException('recipeUrl 参数是必需的', HttpStatus.BAD_REQUEST);
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
    @ApiOperation({summary: '将公共食谱导入本地数据库中'})
    async importRecipe(@Req() req: any, @Body() dto: PublicRecipeImportDto) {
        const ownerId: string | undefined = req?.user?.id || req?.user?.userId || req?.user?.sub;
        if (!ownerId) {
            throw new HttpException('Unauthorized: missing user id in token', HttpStatus.UNAUTHORIZED);
        }
        const {recipe, created} = await this.publicRecipeService.ensureLocalRecipeFromPublic(dto, ownerId);
        return {recipeId: recipe.id, created};
    }
}

