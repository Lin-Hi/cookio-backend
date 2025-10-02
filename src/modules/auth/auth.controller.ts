import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
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
    @ApiOperation({ summary: '用户注册' })
    @ApiResponse({ 
        status: 201, 
        description: '注册成功',
        schema: {
            example: {
                user: {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    email: "user@example.com",
                    display_name: "张三",
                    avatar_url: null,
                    created_at: "2025-10-02T10:30:00.000Z"
                },
                access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
    })
    @ApiResponse({ status: 409, description: '邮箱已被注册' })


    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @ApiOperation({ summary: '用户登录' })
    @ApiResponse({ 
        status: 200, 
        description: '登录成功',
        schema: {
            example: {
                user: {
                    id: "123e4567-e89b-12d3-a456-426614174000",
                    email: "user@example.com",
                    display_name: "张三",
                    avatar_url: null,
                    created_at: "2025-10-02T10:30:00.000Z"
                },
                access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }
    })
    @ApiResponse({ status: 401, description: '邮箱或密码错误' })


    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '获取当前用户信息' })
    @ApiResponse({ 
        status: 200, 
        description: '获取成功',
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
    @ApiResponse({ status: 401, description: '未授权' })


    getProfile( user: User) {
        return user;
    }
}
