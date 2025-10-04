import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { PublicRecipeQueryDto } from './dto/public-recipe-query.dto';

interface EdamamIngredient {
    text: string;
    quantity: number;
    measure: string;
    food: string;
    weight: number;
}

interface EdamamRecipe {
    uri: string;
    label: string;
    image: string;
    source: string;
    url: string;
    yield: number;
    dietLabels: string[];
    healthLabels: string[];
    ingredientLines: string[];
    ingredients: EdamamIngredient[];
    calories: number;
    totalWeight: number;
    cuisineType: string[];
    mealType: string[];
    dishType: string[];
    totalTime: number;
}

interface EdamamResponse {
    from: number;
    to: number;
    count: number;
    _links: any;
    hits: Array<{
        recipe: EdamamRecipe;
    }>;
}

@Injectable()
export class PublicRecipeService {
    private readonly EDAMAM_APP_ID = '34930e1e';
    private readonly EDAMAM_APP_KEY = '384dedda7dd0e2979b3ba2316ee4b704';
    private readonly EDAMAM_BASE_URL = 'https://api.edamam.com/api/recipes/v2';

    /**
     * 搜索 Edamam 公共菜谱并转换为统一格式
     */
    async searchPublicRecipes(query: PublicRecipeQueryDto) {
        try {
            const params: any = {
                type: 'public',
                app_id: this.EDAMAM_APP_ID,
                app_key: this.EDAMAM_APP_KEY,
            };

            // 添加搜索关键词（如果没有其他参数，q 是必需的）
            if (query.q) {
                params.q = query.q;
            }

            // 添加可选过滤参数
            if (query.mealType) {
                params.mealType = query.mealType;
            }
            if (query.cuisineType) {
                params.cuisineType = query.cuisineType;
            }
            if (query.dishType) {
                params.dishType = query.dishType;
            }
            if (query.health) {
                params.health = query.health;
            }
            if (query.diet) {
                params.diet = query.diet;
            }

            // 分页参数
            const pageSize = query.pageSize || 20;
            const from = ((query.page || 1) - 1) * pageSize;
            const to = from + pageSize;

            params.from = from;
            params.to = to;

            // 调用 Edamam API
            const response = await axios.get<EdamamResponse>(this.EDAMAM_BASE_URL, {
                params,
                timeout: 10000,
            });

            // 转换为统一格式
            const items = response.data.hits.map((hit) => this.transformRecipe(hit.recipe));

            return {
                items,
                total: response.data.count,
                page: query.page || 1,
                pageSize,
                from: response.data.from,
                to: response.data.to,
            };
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new HttpException(
                    `外部 API 调用失败: ${error.message}`,
                    error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            throw new HttpException('搜索菜谱时发生错误', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * 将 Edamam 菜谱格式转换为统一的返回格式
     */
    private transformRecipe(edamamRecipe: EdamamRecipe) {
        // 从 URI 中提取 ID
        const recipeId = edamamRecipe.uri.split('#recipe_')[1] || edamamRecipe.uri;

        // 难度评估（基于食材数量和烹饪时间）
        const difficulty = this.estimateDifficulty(
            edamamRecipe.ingredients.length,
            edamamRecipe.totalTime,
        );

        // 转换食材格式 - 返回全部食材
        const ingredients = edamamRecipe.ingredients.map((ing, index) => ({
            id: `${recipeId}-ing-${index}`,
            name: ing.food,
            quantity: ing.quantity ? ing.quantity.toFixed(1) : 'as needed',
            unit: ing.measure || '',
            position: index,
        }));

        // 转换步骤 - 返回全部步骤（使用 ingredientLines）
        const steps = edamamRecipe.ingredientLines.map((line, index) => ({
            id: `${recipeId}-step-${index}`,
            step_no: index + 1,
            content: line,
            image_url: null,
        }));

        // 格式化烹饪时间
        const cookTime = this.formatCookTime(edamamRecipe.totalTime);

        // 菜系类型 - 保持原始英文
        const category = edamamRecipe.cuisineType?.[0] || edamamRecipe.dishType?.[0] || 'Other';

        return {
            id: recipeId,
            title: edamamRecipe.label,
            description: `Recipe from ${edamamRecipe.source}`,
            image_url: edamamRecipe.image,
            category: this.formatCategory(category),
            difficulty: difficulty,
            cook_time: cookTime,
            servings: edamamRecipe.yield || 4,
            is_published: true,
            created_at: new Date().toISOString(),
            owner: {
                id: 'edamam-public',
                email: 'public@edamam.com',
                display_name: edamamRecipe.source,
            },
            ingredients,
            steps,
            // 额外的元数据
            external_url: edamamRecipe.url,
            calories: Math.round(edamamRecipe.calories),
            totalWeight: Math.round(edamamRecipe.totalWeight),
            dietLabels: edamamRecipe.dietLabels,
            healthLabels: edamamRecipe.healthLabels,
        };
    }

    /**
     * 评估难度 - 英文
     */
    private estimateDifficulty(ingredientCount: number, totalTime: number): string {
        if (ingredientCount <= 5 && totalTime <= 30) {
            return 'Easy';
        } else if (ingredientCount <= 10 && totalTime <= 60) {
            return 'Medium';
        } else {
            return 'Hard';
        }
    }

    /**
     * 格式化烹饪时间 - 英文
     */
    private formatCookTime(minutes: number): string {
        if (!minutes || minutes === 0) {
            return 'Unknown';
        }
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }

    /**
     * 格式化菜系类型 - 首字母大写
     */
    private formatCategory(category: string): string {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
}

