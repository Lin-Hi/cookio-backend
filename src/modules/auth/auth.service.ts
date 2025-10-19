import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) {}

    async register(registerDto: RegisterDto) {
        const { email, password, display_name, avatar_url } = registerDto;
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            display_name,
            avatar_url,
        });

        const savedUser = await this.userRepository.save(user);

        const payload = { sub: savedUser.id, email: savedUser.email };
        const access_token = this.jwtService.sign(payload);

        // Return user information and token (excluding password)
        const { password: _, ...userWithoutPassword } = savedUser;
        return {
            user: userWithoutPassword,
            access_token,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.userRepository.findOne({ 
            where: { email },
            select: ['id', 'email', 'password', 'display_name', 'avatar_url', 'created_at']
        });

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const payload = { sub: user.id, email: user.email };
        const access_token = this.jwtService.sign(payload);

        // Return user information and token (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
            access_token,
        };
    }

    // Validate user (for JWT strategy)
    async validateUser(userId: string): Promise<User | null> {
        return this.userRepository.findOne({ 
            where: { id: userId },
            select: ['id', 'email', 'display_name', 'avatar_url', 'bio', 'created_at', 'password']
        });
    }
}
