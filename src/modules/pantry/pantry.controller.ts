import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseUUIDPipe, Req, ForbiddenException, UseGuards } from '@nestjs/common';
import { PantryService } from './pantry.service';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('pantry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('pantry')
export class PantryController {
    constructor(private readonly service: PantryService) {}

    private ensureOwner(req: any, userId: string) {
        if (req.user?.id !== userId) throw new ForbiddenException('Not allowed to access this user pantry');
    }

    @Get(':userId')
    list(
        @Req() req: any,
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '10',
        @Query('q') q?: string,
        @Query('sortBy') sortBy?: 'createdAt'|'name'|'expiresAt',
        @Query('order') order?: 'ASC'|'DESC',
        @Query('expiringWithin') expiringWithin?: string,
    ) {
        this.ensureOwner(req, userId);
        return this.service.list(userId, Number(page), Number(limit), {
            q,
            sortBy,
            order,
            expiringWithin: expiringWithin ? Number(expiringWithin) : undefined,
        });
    }


    @Post(':userId/items')
    @ApiCreatedResponse({ description: 'Create a pantry item for a user.' })
    create(
        @Req() req: any,
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Body() dto: CreatePantryItemDto,
    ) {
        this.ensureOwner(req, userId);
        return this.service.create(userId, dto);
    }

    @Put(':userId/items/:itemId')
    @ApiOkResponse({ description: 'Update a pantry item.' })
    update(
        @Req() req: any,
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('itemId', new ParseUUIDPipe()) itemId: string,
        @Body() dto: UpdatePantryItemDto,
    ) {
        this.ensureOwner(req, userId);
        return this.service.update(userId, itemId, dto);
    }

    @Delete(':userId/items/:itemId')
    @ApiOkResponse({ description: 'Delete a pantry item.' })
    remove(
        @Req() req: any,
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('itemId', new ParseUUIDPipe()) itemId: string,
    ) {
        this.ensureOwner(req, userId);
        return this.service.remove(userId, itemId);
    }
}
