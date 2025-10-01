import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Put, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RecipesService } from '../recipes/recipes.service'; // <-- inject

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly service: UsersService,
        private readonly recipesService: RecipesService, // <-- inject service
    ) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateUserDto) {
        return this.service.create(dto);
    }

    @Put(':id')
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.remove(id);
    }

    // list recipes of a user with search & pagination
    @Get(':id/recipes')
    @ApiParam({ name: 'id', required: true })
    @ApiQuery({ name: 'q', required: false })
    @ApiQuery({ name: 'page', required: false })
    @ApiQuery({ name: 'pageSize', required: false })
    listUserRecipes(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Query('q') q?: string,
        @Query('page') page = '1',
        @Query('pageSize') pageSize = '20',
    ) {
        return this.recipesService.findAll({
            q,
            ownerId: id,
            category: undefined,
            difficulty: undefined,
            page: Number(page),
            pageSize: Number(pageSize),
        });
    }
}
