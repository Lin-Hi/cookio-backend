import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'User registration' })
    @ApiResponse({ 
        status: 201, 
        description: 'Registration successful',
        schema: {
            example: {
                user: {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    email: "user@example.com",
                    display_name: "John Doe",
                    avatar_url: null,
                    created_at: "2025-10-02T10:30:00.000Z"
                },
                access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
    })
    @ApiResponse({ status: 409, description: 'Email already registered' })


    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({ summary: 'User login' })
    @ApiResponse({ 
        status: 200, 
        description: 'Login successful',
        schema: {
            example: {
                user: {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    email: "user@example.com",
                    display_name: "John Doe",
                    avatar_url: null,
                    created_at: "2025-10-02T10:30:00.000Z"
                },
                access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Invalid email or password' })


    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user information' })
    @ApiResponse({ 
        status: 200, 
        description: 'User information retrieved successfully',
        schema: {
            example: {
                id: "123e4567-e89b-12d3-a456-426614174000",
                email: "user@example.com",
                display_name: "张三",
                avatar_url: null,
                created_at: "2025-10-02T10:30:00.000Z"
            }
        }
    })
    @ApiResponse({ status: 401, description: 'Unauthorized' })


    getProfile(@Request() req: any) {
        return req.user;
    }
}
