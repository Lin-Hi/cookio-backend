import { Controller, Get, Post, Body, Param, ParseUUIDPipe, Put, Delete, Query, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiTags, ApiParam, ApiQuery, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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
    findAll() {
        return this.service.findAll();
    }

    @Post()
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
    findOne(@Param('id', new ParseUUIDPipe()) id: string) {
        return this.service.findOne(id);
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
