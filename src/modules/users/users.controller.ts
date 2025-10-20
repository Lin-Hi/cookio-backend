import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Put, Delete, Query, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiTags, ApiParam, ApiQuery, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { RecipesService } from '../recipes/recipes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(
        private readonly service: UsersService,
        private readonly recipesService: RecipesService,
    ) {}

    @Get()
    @ApiOperation({ 
        summary: 'List all users',
        description: 'Get a list of all registered users (admin use only)'
    })
    @ApiResponse({
        status: 200,
        description: 'Users retrieved successfully',
        schema: {
            example: [
                {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    email: "user1@example.com",
                    display_name: "John Doe",
                    avatar_url: "https://example.com/avatar1.jpg",
                    created_at: "2025-10-01T10:00:00.000Z"
                },
                {
                    id: "987e6543-e21c-34b5-b678-987654321000",
                    email: "user2@example.com",
                    display_name: "Jane Smith",
                    avatar_url: "https://example.com/avatar2.jpg",
                    created_at: "2025-10-02T10:00:00.000Z"
                }
            ]
        }
    })
    findAll() {
        return this.service.findAll();
    }

    @Post()
    @ApiOperation({ 
        summary: 'Create a new user',
        description: 'Register a new user account (typically handled by auth/register instead)'
    })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({
        status: 201,
        description: 'User created successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                email: "newuser@example.com",
                display_name: "New User",
                avatar_url: null,
                created_at: "2025-10-15T10:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 409, description: 'Email already exists' })
    create(@Body() dto: CreateUserDto) {
        return this.service.create(dto);
    }

    // Profile management endpoints
    @Put('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user profile' })
    @ApiResponse({ 
        status: 200, 
        description: 'Profile updated successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                email: "user@example.com",
                display_name: "John Doe",
                avatar_url: "https://example.com/avatar.jpg",
                bio: "I love cooking Italian food!",
                created_at: "2025-10-02T10:30:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
        const userId = req.user.id;
        if (!userId) {
            throw new UnauthorizedException('User ID not found in token');
        }
        return this.service.updateProfile(userId, dto);
    }

    @Put('profile/password')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change user password' })
    @ApiResponse({ 
        status: 200, 
        description: 'Password changed successfully',
        schema: {
            example: {
                message: "Password changed successfully"
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Current password is incorrect' })
    @ApiResponse({ status: 404, description: 'User not found' })
    changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
        const userId = req.user.sub || req.user.id;
        if (!userId) {
            throw new UnauthorizedException('User ID not found in token');
        }
        return this.service.changePassword(userId, dto);
    }

    @Get('profile/stats')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user statistics' })
    @ApiResponse({ 
        status: 200, 
        description: 'User statistics retrieved successfully',
        schema: {
            example: {
                recipesCreated: 12,
                recipesFavorited: 45,
                recipesCooked: 28,
                recipesInQueue: 5
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    getUserStats(@Request() req: any) {
        const userId = req.user.sub || req.user.id;
        if (!userId) {
            throw new UnauthorizedException('User ID not found in token');
        }
        return this.service.getUserStats(userId);
    }

    @Get(':id')
    @ApiOperation({ 
        summary: 'Get user by ID',
        description: 'Retrieve detailed information about a specific user'
    })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiResponse({
        status: 200,
        description: 'User retrieved successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                email: "user@example.com",
                display_name: "John Doe",
                avatar_url: "https://example.com/avatar.jpg",
                bio: "I love cooking Italian food!",
                created_at: "2025-10-01T10:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.findOne(id);
    }

    @Put(':id')
    @ApiOperation({ 
        summary: 'Update user',
        description: 'Update user information (admin use only - users should use PUT /users/profile instead)'
    })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({
        status: 200,
        description: 'User updated successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                email: "user@example.com",
                display_name: "John Doe Updated",
                avatar_url: "https://example.com/new-avatar.jpg",
                updated_at: "2025-10-15T12:00:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 404, description: 'User not found' })
    update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateUserDto) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ 
        summary: 'Delete user',
        description: 'Permanently delete a user account (admin use only)'
    })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiResponse({
        status: 200,
        description: 'User deleted successfully',
        schema: {
            example: {
                deleted: true
            }
        }
    })
    @ApiResponse({ status: 404, description: 'User not found' })
    remove(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.remove(id);
    }

    // list recipes of a user with search & pagination
    @Get(':id/recipes')
    @ApiOperation({ 
        summary: 'List user\'s recipes',
        description: 'Get all recipes created by a specific user with optional search and pagination'
    })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid', description: 'User UUID' })
    @ApiQuery({ name: 'q', required: false, type: String, description: 'Search keyword for recipe title', example: 'chicken' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)', example: 1 })
    @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Items per page (default: 20)', example: 20 })
    @ApiResponse({
        status: 200,
        description: 'User recipes retrieved successfully',
        schema: {
            example: {
                items: [
                    {
                        id: "123e4567-e89b-12d3-a456-426614174000",
                        title: "Tomato Scrambled Eggs",
                        description: "A classic Chinese home-style dish",
                        image_url: "https://example.com/recipe.jpg",
                        category: "Chinese",
                        difficulty: "Easy",
                        is_published: true,
                        created_at: "2025-10-01T10:00:00.000Z"
                    }
                ],
                total: 12,
                page: 1,
                pageSize: 20
            }
        }
    })
    @ApiResponse({ status: 404, description: 'User not found' })
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
