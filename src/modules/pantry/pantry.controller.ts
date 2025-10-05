import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseUUIDPipe } from '@nestjs/common';
import { PantryService } from './pantry.service';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('pantry')
@Controller('pantry')
export class PantryController {
    constructor(private readonly service: PantryService) {}

    @Get(':userId')
    @ApiOkResponse({ description: 'List pantry items for a user with pagination.' })
    list(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
    ) {
        return this.service.list(userId, Number(page), Number(limit));
    }

    @Post(':userId/items')
    @ApiCreatedResponse({ description: 'Create a pantry item for a user.' })
    create(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Body() dto: CreatePantryItemDto,
    ) {
        return this.service.create(userId, dto);
    }

    @Put(':userId/items/:itemId')
    @ApiOkResponse({ description: 'Update a pantry item.' })
    update(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('itemId', new ParseUUIDPipe()) itemId: string,
        @Body() dto: UpdatePantryItemDto,
    ) {
        return this.service.update(userId, itemId, dto);
    }

    @Delete(':userId/items/:itemId')
    @ApiOkResponse({ description: 'Delete a pantry item.' })
    remove(
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('itemId', new ParseUUIDPipe()) itemId: string,
    ) {
        return this.service.remove(userId, itemId);
    }
}
