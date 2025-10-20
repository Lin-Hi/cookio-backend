import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseUUIDPipe, Req, ForbiddenException, UseGuards } from '@nestjs/common';
import { PantryService } from './pantry.service';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { ListPantryQueryDto } from './dto/list-pantry.query';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth, ApiOperation, ApiParam, ApiBody, ApiResponse, ApiQuery } from '@nestjs/swagger';
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
    @ApiOperation({ 
        summary: 'List pantry items',
        description: 'Get a paginated list of pantry items for a specific user with optional filtering and sorting'
    })
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10)' })
    @ApiQuery({ name: 'q', required: false, type: String, description: 'Search keyword for item name' })
    @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt','name','expiresAt'], description: 'Sort field' })
    @ApiQuery({ name: 'order', required: false, enum: ['ASC','DESC'], description: 'Sort order' })
    @ApiQuery({ name: 'expiringWithin', required: false, type: Number, description: 'Filter items expiring within N days' })
    @ApiQuery({ name: 'category', required: false, type: String, description: 'Filter by category' })
    @ApiResponse({ 
        status: 200,
        description: 'Pantry items retrieved successfully',
        schema: {
            example: {
                items: [
                    {
                        id: "123e4567-e89b-12d3-a456-426614174000",
                        name: "Tomato",
                        quantity: "2",
                        unit: "kg",
                        category: "Vegetables",
                        image_url: "https://example.com/tomato.jpg",
                        description: "Fresh organic tomatoes",
                        expiresAt: "2025-10-31",
                        created_at: "2025-10-01T10:00:00.000Z"
                    }
                ],
                total: 25,
                page: 1,
                limit: 10
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    @ApiResponse({ status: 403, description: 'Forbidden - Cannot access another user\'s pantry' })
    list(
        @Req() req: any,
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Query() query: ListPantryQueryDto,
    ) {
        this.ensureOwner(req, userId);
        return this.service.list(userId, query.page, query.limit, {
            q: query.q,
            sortBy: query.sortBy,
            order: query.order,
            expiringWithin: query.expiringWithin,
            category: query.category,
        });
    }


    @Post(':userId/items')
    @ApiOperation({ 
        summary: 'Create a pantry item',
        description: 'Add a new item to user\'s pantry inventory. Supports uploading images as URLs or base64 data.'
    })
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiBody({ type: CreatePantryItemDto })
    @ApiResponse({ 
        status: 201,
        description: 'Pantry item created successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                name: "Tomato",
                quantity: "2",
                unit: "kg",
                category: "Vegetables",
                image_url: "https://example.com/tomato.jpg",
                description: "Fresh organic tomatoes",
                expiresAt: "2025-10-31",
                created_at: "2025-10-01T10:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    @ApiResponse({ status: 403, description: 'Forbidden - Cannot access another user\'s pantry' })
    create(
        @Req() req: any,
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Body() dto: CreatePantryItemDto,
    ) {
        this.ensureOwner(req, userId);
        return this.service.create(userId, dto);
    }

    @Put(':userId/items/:itemId')
    @ApiOperation({ 
        summary: 'Update a pantry item',
        description: 'Update an existing pantry item. All fields are optional - only provided fields will be updated.'
    })
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiParam({ name: 'itemId', type: 'string', format: 'uuid', description: 'Pantry item UUID' })
    @ApiBody({ type: UpdatePantryItemDto })
    @ApiResponse({ 
        status: 200,
        description: 'Pantry item updated successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                name: "Tomato",
                quantity: "3",
                unit: "kg",
                category: "Vegetables",
                image_url: "https://example.com/tomato.jpg",
                description: "Fresh organic tomatoes",
                expiresAt: "2025-11-15",
                updated_at: "2025-10-02T12:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    @ApiResponse({ status: 403, description: 'Forbidden - Cannot access another user\'s pantry' })
    @ApiResponse({ status: 404, description: 'Pantry item not found' })
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
    @ApiOperation({ 
        summary: 'Delete a pantry item',
        description: 'Permanently remove an item from user\'s pantry inventory'
    })
    @ApiParam({ name: 'userId', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiParam({ name: 'itemId', type: 'string', format: 'uuid', description: 'Pantry item UUID' })
    @ApiResponse({ 
        status: 200,
        description: 'Pantry item deleted successfully',
        schema: {
            example: {
                deleted: true
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
    @ApiResponse({ status: 403, description: 'Forbidden - Cannot access another user\'s pantry' })
    @ApiResponse({ status: 404, description: 'Pantry item not found' })
    remove(
        @Req() req: any,
        @Param('userId', new ParseUUIDPipe()) userId: string,
        @Param('itemId', new ParseUUIDPipe()) itemId: string,
    ) {
        this.ensureOwner(req, userId);
        return this.service.remove(userId, itemId);
    }
}
