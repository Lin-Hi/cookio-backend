import { Controller, Get, Post, Body, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import {ApiTags, ApiQuery, ApiParam, ApiOperation} from '@nestjs/swagger';
import { Put, Delete } from '@nestjs/common';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import {IsEnum, IsInt, IsOptional, IsString, IsUUID, Min} from "class-validator";
import {Transform, Type} from "class-transformer";

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
    @ApiOperation({ summary: 'List recipes with search & pagination' })
    @ApiQuery({ name: 'q', required: false, description: 'Keyword search' })
    @ApiQuery({ name: 'category', required: false })
    @ApiQuery({ name: 'difficulty', required: false })
    @ApiQuery({ name: 'ownerId', required: false })
    @ApiQuery({ name: 'source', required: false, enum: RecipeSource })
    @ApiQuery({ name: 'is_published', required: false, description: 'true/false' })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'pageSize', required: false })
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
    @ApiParam({ name: 'id', type: 'string', required: true })
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateRecipeDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateRecipeDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.remove(id);
    }
}
