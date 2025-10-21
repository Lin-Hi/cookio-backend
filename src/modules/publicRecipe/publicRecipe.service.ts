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

    private readonly EDAMAM_APP_ID = '428ba23e';
    private readonly EDAMAM_APP_KEY = '4604940533a1b7f9d05b05e83bb77c33';
    private readonly EDAMAM_BASE_URL = 'https://api.edamam.com/api/recipes/v2';

    private readonly SPOONACULAR_API_KEYS = [
        '680da435be754ceaa046bb1a3be1e563',
        '4364dbc551284eceb8ceaa815db7c340',
        '6522a0b791764a61839b38af2c10510b',
        '609b48ffbea84bb791e19acb10706760'
    ];
    private currentKeyIndex = 0;
    private readonly SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

    /**
     * Get current available Spoonacular API key
     */
    private getCurrentApiKey(): string {
        return this.SPOONACULAR_API_KEYS[this.currentKeyIndex];
    }

    /**
     * Switch to next API key
     */
    private switchToNextApiKey(): boolean {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.SPOONACULAR_API_KEYS.length;
        return this.currentKeyIndex === 0; // If back to first key, all keys have been used
    }

    /**
     * Search Edamam public recipes and convert to unified format
     */
    async searchPublicRecipes(query: PublicRecipeQueryDto) {
        try {
            const params: any = {
                type: 'public',
                app_id: this.EDAMAM_APP_ID,
                app_key: this.EDAMAM_APP_KEY,
            };

            // Add search keywords (q is required if no other parameters)
            if (query.q) {
                params.q = query.q;
            }

            // Add optional filter parameters
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

            // Pagination parameters
            const pageSize = query.pageSize || 20;
            const from = ((query.page || 1) - 1) * pageSize;
            const to = from + pageSize;

            params.from = from;
            params.to = to;
            params.random = true;
            
            // Call Edamam API
            const response = await axios.get<EdamamResponse>(this.EDAMAM_BASE_URL, {
                params,
                timeout: 10000,
            });

            // Convert to unified format
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
                    `External API call failed: ${error.message}`,
                    error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            throw new HttpException('Error occurred while searching recipes', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Convert Edamam recipe format to unified return format
     */
    private transformRecipe(edamamRecipe: EdamamRecipe) {
        // Extract ID from URI
        const recipeId = edamamRecipe.uri.split('#recipe_')[1] || edamamRecipe.uri;

        // Difficulty assessment (based on ingredient count and cooking time)
        const difficulty = this.estimateDifficulty(
            edamamRecipe.ingredients.length,
            edamamRecipe.totalTime,
        );

        // Convert ingredient format - return all ingredients
        const ingredients = edamamRecipe.ingredients.map((ing, index) => ({
            id: `${recipeId}-ing-${index}`,
            name: ing.food,
            quantity: ing.quantity ? ing.quantity.toFixed(1) : 'as needed',
            unit: ing.measure || '',
            position: index,
        }));

        // Format cooking time
        const cookTime = this.formatCookTime(edamamRecipe.totalTime);

        // Cuisine type - keep original English
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
     * Get recipe steps from Spoonacular API (public method)
     */
    async fetchRecipeSteps(recipeUrl: string, recipeId?: string) {
        // If no recipeId provided, generate a temporary one
        const id = recipeId || 'recipe';
        
        // let is necessary: attempts counter needs to be modified in the loop
        let attempts = 0;
        const maxAttempts = this.SPOONACULAR_API_KEYS.length;
        
        while (attempts < maxAttempts) {
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
                            apiKey: this.getCurrentApiKey(),
                        },
                        timeout: 60000,
                    }
                );

                // Extract and convert steps
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

                // If no steps, return empty array
                return [];
            } catch (error) {
                attempts++;
                
                // Check if 402 error (quota exhausted)
                if (axios.isAxiosError(error) && error.response?.status === 402) {

                    // Switch to next API key
                    const allKeysUsed = this.switchToNextApiKey();
                    
                    if (allKeysUsed) {
                        return [];
                    }
                    
                    // Continue trying next key
                    continue;
                }
                
                // Other errors, log and return empty array
                return [];
            }
        }
        
        // If all keys have been tried, return empty array
        return [];
    }

    /**
     * Assess difficulty - English
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
     * Format cooking time - English
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
     * Format cuisine type - capitalize first letter
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
        const normSourceId = String(dto.sourceId).trim().toLowerCase(); // Normalize to avoid case/space duplicates

        return this.dataSource.transaction(async (manager) => {
            // 1) Fast path: if exists, return directly
            const existed = await manager.findOne(Recipe, { where: { source: normSource, sourceId: normSourceId } });
            if (existed) return { recipe: existed, created: false };

            // 2) Try insert, use ON CONFLICT DO NOTHING to handle concurrency/duplicates
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
                    category: dto.category ?? undefined,
                    difficulty: dto.difficulty ?? undefined,
                    cook_time: dto.cookTime ?? undefined,
                    servings: dto.servings ?? undefined,
                    author: dto.author ?? undefined,
                    sourceData: dto.sourceData ?? undefined,
                    is_published: false,
                    owner: { id: ownerId } as any,
                })
                .orIgnore() // If unique constraint violated, ignore insert
                .returning(['id']) // PG can return id; if DO NOTHING, no row returned
                .execute();

            // let is necessary: recipeId needs to be reassigned in the conditional block
            let recipeId: string | undefined = insertResult.identifiers?.[0]?.id || insertResult.generatedMaps?.[0]?.id;

            // 3) If DO NOTHING due to concurrency, recheck existing record
            if (!recipeId) {
                const already = await manager.findOneOrFail(Recipe, { where: { source: normSource, sourceId: normSourceId } });
                recipeId = already.id;
            }

            // 4) Use obtained recipeId to continue with ingredients/steps (if concurrent insert, ingredients/steps may already exist.
            //    For "minimal changes", we only write on first insert; if concurrency causes non-first, add existence check or ignore errors)

            const recipe = await manager.findOneOrFail(Recipe, { where: { id: recipeId } });

            // Ingredients (only write on first insert; simple check: if passed ingredients and current DB has 0)
            const ingCount = await manager.count(RecipeIngredient, { where: { recipe: { id: recipeId } } });
            if (ingCount === 0 && (dto.ingredients?.length ?? 0) > 0) {
                // let is necessary: loop counter 'i' is used as position in the database
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

            // Steps: only use passed steps, no synchronous fetching (changed to async processing)
            const stepCount = await manager.count(RecipeStep, { where: { recipe: { id: recipeId } } });
            if (stepCount === 0 && dto.steps && dto.steps.length > 0) {
                dto.steps.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
                // let is necessary: loop counter 'i' is used to calculate step_no fallback
                for (let i = 0; i < dto.steps.length; i++) {
                    const stepNo = Number.isFinite(Number(dto.steps[i].number)) ? Number(dto.steps[i].number) : i + 1;
                    const content = (dto.steps[i].instruction ?? '').toString().trim() || '-';

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

    /**
     * Asynchronously fetch and update recipe steps
     * Used to supplement step information after quick import
     */
    async fetchAndUpdateSteps(recipeId: string): Promise<{ success: boolean; stepsCount: number }> {
        try {
            const recipe = await this.recipeRepo.findOne({ 
                where: { id: recipeId },
                relations: ['steps']
            });
            
            if (!recipe) {
                throw new Error('Recipe not found');
            }

            if (!recipe.sourceUrl) {
                throw new Error('Recipe source URL not available');
            }

            // Get steps
            const fetchedSteps = await this.fetchRecipeSteps(recipe.sourceUrl, recipeId);
            if (!fetchedSteps || fetchedSteps.length === 0) {
                return { success: false, stepsCount: 0 };
            }

            // Save steps to database (delete existing steps first, then insert new ones)
            await this.dataSource.transaction(async (manager) => {
                // Delete existing steps first to avoid duplicate key constraint errors
                await manager.delete(RecipeStep, { recipe: { id: recipeId } });
                
                // Insert new steps
                // let is necessary: loop counter 'idx' is used to calculate step_no fallback
                for (let idx = 0; idx < fetchedSteps.length; idx++) {
                    const step = fetchedSteps[idx];
                    const stepData = {
                        recipe: { id: recipeId },
                        step_no: step.step_no || idx + 1,
                        content: step.content || String(step).trim() || '-'
                    };
                    await manager.save(manager.create(RecipeStep, stepData));
                }
            });

            return { success: true, stepsCount: fetchedSteps.length };
        } catch (error) {
            console.error('[Fetch and Update Steps Error]', error);
            return { success: false, stepsCount: 0 };
        }
    }

    /**
     * Directly save step data to database
     * Used to save already fetched step data
     */
    async saveSteps(recipeId: string, steps: any[]): Promise<{ success: boolean; stepsCount: number }> {
        try {
            const recipe = await this.recipeRepo.findOne({ 
                where: { id: recipeId },
                relations: ['steps']
            });
            
            if (!recipe) {
                throw new Error('Recipe not found');
            }

            // Delete existing steps (if any)
            if (recipe.steps && recipe.steps.length > 0) {
                await this.dataSource.transaction(async (manager) => {
                    for (const step of recipe.steps) {
                        await manager.remove(step);
                    }
                });
            }

            // Convert step data format
            const stepsToSave = steps.map((step, idx) => ({
                step_no: step.step_no || idx + 1,
                content: step.content || (typeof step === 'string' ? step.trim() : String(step).trim()) || '-'
            }));

            // Save steps to database
            await this.dataSource.transaction(async (manager) => {
                for (const step of stepsToSave) {
                    const createdStep = manager.create(RecipeStep, {
                        ...step,
                        recipe: recipe
                    });
                    await manager.save(createdStep);
                }
            });

            return { success: true, stepsCount: stepsToSave.length };
        } catch (error) {
            console.error('[Save Steps Error]', error);
            return { success: false, stepsCount: 0 };
        }
    }


}

