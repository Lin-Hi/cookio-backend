import { Controller, Get, Post, Body, Query, Param, ParseUUIDPipe } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { ApiTags, ApiQuery, ApiParam } from '@nestjs/swagger';
import { Put, Delete } from '@nestjs/common';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@ApiTags('recipes')
@Controller('recipes')
export class RecipesController {
    constructor(private readonly service: RecipesService) {}

    @Get()
    @ApiQuery({ name: 'q', required: false })
    @ApiQuery({ name: 'category', required: false })
    @ApiQuery({ name: 'difficulty', required: false })
    @ApiQuery({ name: 'ownerId', required: false })
    @ApiQuery({
        name: 'source',
        required: false,
        description: "recipe source, default 'community'",
        enum: ['community', 'edamam', 'spoonacular'],
    })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'pageSize', required: false })
    findAll(
        @Query('q') q?: string,
        @Query('category') category?: string,
        @Query('difficulty') difficulty?: string,
        @Query('ownerId') ownerId?: string,
        @Query('source') source: 'community' | 'edamam' | 'spoonacular' = 'community',
        @Query('page') page = '1',
        @Query('pageSize') pageSize = '20',
    ) {
        return this.service.findAll({
            q,
            category,
            difficulty,
            ownerId,
            source,
            page: Number(page),
            pageSize: Number(pageSize),
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
