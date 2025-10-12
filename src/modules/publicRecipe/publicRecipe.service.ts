import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { PublicRecipeQueryDto } from './dto/public-recipe-query.dto';
import {InjectRepository} from "@nestjs/typeorm";
import {Recipe} from "../recipes/entities/recipe.entity";
import {DataSource, Repository} from "typeorm";
import {RecipeIngredient} from "../recipes/entities/recipe-ingredient.entity";
import {RecipeStep} from "../recipes/entities/recipe-step.entity";
import {PublicRecipeImportDto} from "./dto/public-recipe-import.dto";

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

interface SpoonacularStep {
    number: number;
    step: string;
    ingredients: any[];
    equipment: any[];
}

interface SpoonacularAnalyzedInstruction {
    name: string;
    steps: SpoonacularStep[];
}

interface SpoonacularRecipeResponse {
    analyzedInstructions: SpoonacularAnalyzedInstruction[];
}

@Injectable()
export class PublicRecipeService {
    constructor(
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        private readonly dataSource: DataSource,
    ) {}

    private readonly EDAMAM_APP_ID = '34930e1e';
    private readonly EDAMAM_APP_KEY = '384dedda7dd0e2979b3ba2316ee4b704';
    private readonly EDAMAM_BASE_URL = 'https://api.edamam.com/api/recipes/v2';
    // private readonly SPOONACULAR_API_KEY = '680da435be754ceaa046bb1a3be1e563';
    // private readonly SPOONACULAR_API_KEY = '4364dbc551284eceb8ceaa815db7c340';
    // private readonly SPOONACULAR_API_KEY = '6522a0b791764a61839b38af2c10510b';
    private readonly SPOONACULAR_API_KEY = '609b48ffbea84bb791e19acb10706760';
    private readonly SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

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
            params.random = true;
            
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
            external_url: edamamRecipe.url,
            calories: Math.round(edamamRecipe.calories),
            totalWeight: Math.round(edamamRecipe.totalWeight),
            dietLabels: edamamRecipe.dietLabels,
            healthLabels: edamamRecipe.healthLabels,
        };
    }

    /**
     * 从 Spoonacular API 获取菜谱步骤（公开方法）
     */
    async fetchRecipeSteps(recipeUrl: string, recipeId?: string) {
        // 如果没有提供 recipeId，生成一个临时的
        const id = recipeId || 'recipe';
        try {
            const response = await axios.get<SpoonacularRecipeResponse>(
                `${this.SPOONACULAR_BASE_URL}/recipes/extract`,
                {
                    params: {
                        url: recipeUrl,
                        forceExtraction: true,
                        analyze: false,
                        includeNutrition: false,
                        includeTaste: false,
                        apiKey: this.SPOONACULAR_API_KEY,
                    },
                    timeout: 60000,
                }
            );

            // 提取并转换步骤
            if (response.data.analyzedInstructions && response.data.analyzedInstructions.length > 0) {
                const allSteps = response.data.analyzedInstructions.flatMap(
                    (instruction) => instruction.steps
                );

                return allSteps.map((step) => ({
                    id: `${id}-step-${step.number}`,
                    step_no: step.number,
                    content: step.step,
                    image_url: null,
                }));
            }

            // 如果没有步骤，返回空数组
            return [];
        } catch (error) {
            // 如果 Spoonacular API 调用失败，返回空步骤数组
            console.error('Failed to fetch steps from Spoonacular:', error);
            return [];
        }
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

    /**
     * Ensure a local recipe exists for (source, sourceId).
     * If not present, materialize Recipe + Ingredients + Steps in a transaction.
     * Steps priority:
     *  1) use normalized steps from payload
     *  2) otherwise fetch via fetchRecipeSteps(recipeUrl, recipeId)
     */
    async ensureLocalRecipeFromPublic(dto: PublicRecipeImportDto, ownerId: string) {
        const normSource = dto.source; // 'edamam' | 'spoonacular'
        const normSourceId = String(dto.sourceId).trim().toLowerCase(); // 规范化，避免大小写/空格造成重复

        return this.dataSource.transaction(async (manager) => {
            // 1) fast path：已存在则直接返回
            const existed = await manager.findOne(Recipe, { where: { source: normSource, sourceId: normSourceId } });
            if (existed) return { recipe: existed, created: false };

            const insertResult = await manager
                .createQueryBuilder()
                .insert()
                .into(Recipe)
                .values({
                    title: dto.title,
                    description: dto.description ?? undefined,
                    source: normSource,
                    sourceId: normSourceId,
                    sourceUrl: dto.recipeUrl ?? undefined,
                    image_url: dto.imageUrl ?? undefined,
                    sourceData: dto.sourceData ?? undefined,
                    is_published: false,
                })
                .returning(['id']) // PG 可返回 id；若被 DO NOTHING，不会返回行
                .execute();

            let recipeId: string | undefined = insertResult.identifiers?.[0]?.id || insertResult.generatedMaps?.[0]?.id;

            // 3) 如果因为并发被 DO NOTHING，则回查已存在的记录
            if (!recipeId) {
                const already = await manager.findOneOrFail(Recipe, { where: { source: normSource, sourceId: normSourceId } });
                recipeId = already.id;
            }

            // 4) 用拿到的 recipeId 继续落配料/步骤（若是并发插入，这里可能已存在配料/步骤。
            //    为“最小改动”，我们只在首次插入时写入；若并发导致非首次，可加存在性检查或忽略错误）

            const recipe = await manager.findOneOrFail(Recipe, { where: { id: recipeId } });

            // Ingredients（仅当首次插入才写；简单判断：如果传入有 ingredients 且当前库里为 0）
            const ingCount = await manager.count(RecipeIngredient, { where: { recipe: { id: recipeId } } });
            if (ingCount === 0 && (dto.ingredients?.length ?? 0) > 0) {
                for (let i = 0; i < dto.ingredients.length; i++) {
                    const ing = dto.ingredients[i];
                    await manager.save(
                        manager.create(RecipeIngredient, {
                            recipe,
                            name: ing.name,
                            quantity: ing.quantity ?? undefined,
                            unit: ing.unit ?? undefined,
                            position: i,
                        }),
                    );
                }
            }

            // Steps：优先用传入；为空时尝试抓取；同样仅在库里没有步骤时写入
            const stepCount = await manager.count(RecipeStep, { where: { recipe: { id: recipeId } } });
            if (stepCount === 0) {
                let steps = dto.steps ?? [];
                if ((!steps || steps.length === 0) && dto.recipeUrl) {
                    const fetched = await this.fetchRecipeSteps(dto.recipeUrl, recipeId);
                    steps = (fetched ?? []).map((text: any, idx: number) => ({ number: idx + 1, instruction: String(text) }));
                }
                steps.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
                for (let i = 0; i < steps.length; i++) {
                    const stepNo = Number.isFinite(Number(steps[i].number)) ? Number(steps[i].number) : i + 1;
                    const content = (steps[i].instruction ?? '').toString().trim() || '-';

                    await manager.save(
                        manager.create(RecipeStep as any, {
                            recipe,
                            step_no: stepNo,
                            content,
                        }),
                    );
                }
            }

            return { recipe, created: !!insertResult.identifiers?.length };
        });
    }


}

