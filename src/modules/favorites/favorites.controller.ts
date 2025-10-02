import { Controller, Get, Post, Delete, Param, ParseUUIDPipe } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('favorites')
@Controller('favorites')
export class FavoritesController {
    constructor(private readonly service: FavoritesService) {}

    @Get(':userId')
    list(@Param('userId', new ParseUUIDPipe()) userId: string) {
        return this.service.listByUser(userId);
    }

    @Post(':userId/:recipeId')
    add(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.add(userId, recipeId);
    }

    @Delete(':userId/:recipeId')
    remove(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('recipeId', new ParseUUIDPipe()) recipeId: string,
    ) {
        return this.service.remove(userId, recipeId);
    }
}
