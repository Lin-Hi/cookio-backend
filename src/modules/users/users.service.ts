import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserStatsDto } from './dto/user-stats.dto';
import { Recipe } from '../recipes/entities/recipe.entity';
import { Favorite } from '../favorites/favorite.entity';
import { QueueItem } from '../cookflow/queue-item.entity';
import { CookedRecipe } from '../cookflow/cooked-recipe.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly repo: Repository<User>,
        @InjectRepository(Recipe) private readonly recipeRepo: Repository<Recipe>,
        @InjectRepository(Favorite) private readonly favoriteRepo: Repository<Favorite>,
        @InjectRepository(QueueItem) private readonly queueRepo: Repository<QueueItem>,
        @InjectRepository(CookedRecipe) private readonly cookedRepo: Repository<CookedRecipe>,
    ) {}

    async create(dto: CreateUserDto) {
        const exist = await this.repo.findOne({ where: { email: dto.email } });
        if (exist) {
            throw new ConflictException('This email is already registered');
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        
        const u = this.repo.create({
            ...dto,
            password: hashedPassword,
        });
        
        const savedUser = await this.repo.save(u);
        
        // Exclude password from returned user object
        const { password, ...userWithoutPassword } = savedUser;
        return userWithoutPassword;
    }

    findAll() {
        return this.repo.find();
    }

    async findOne(id: string) {
        return this.repo.findOneByOrFail({ id });
    }

    async update(id: string, dto: UpdateUserDto) {
        const user = await this.repo.findOneByOrFail({ id });
        this.repo.merge(user, dto);
        return this.repo.save(user);
    }

    async remove(id: string) {
        const user = await this.repo.findOneByOrFail({ id });
        await this.repo.remove(user);
        return { deleted: true };
    }

    /**
     * Update user profile information (display_name, bio, avatar_url)
     * @param userId - User ID
     * @param dto - Profile update data
     * @returns Updated user without password
     */
    async updateProfile(userId: string, dto: UpdateProfileDto) {
        const user = await this.repo.findOneByOrFail({ id: userId });

        // Update only provided fields
        if (dto.display_name !== undefined) {
            user.display_name = dto.display_name;
        }
        if (dto.bio !== undefined) {
            user.bio = dto.bio;
        }
        if (dto.avatar_url !== undefined) {
            user.avatar_url = dto.avatar_url;
        }

        const updatedUser = await this.repo.save(user);

        // Return user without password
        const { password, ...userWithoutPassword } = updatedUser;
        return userWithoutPassword;
    }

    /**
     * Change user password with current password verification
     * @param userId - User ID
     * @param dto - Password change data
     * @returns Success message
     */
    async changePassword(userId: string, dto: ChangePasswordDto) {
        const user = await this.repo.findOneOrFail({ 
            where: { id: userId },
            select: ['id', 'password'] // Only select password for verification
        });

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(dto.newPassword, 12);
        
        // Update password
        await this.repo.update(userId, { password: hashedNewPassword });

        return { message: 'Password changed successfully' };
    }

    /**
     * Get user statistics (recipe counts)
     * @param userId - User ID
     * @returns User statistics
     */
    async getUserStats(userId: string): Promise<UserStatsDto> {
        // Verify user exists
        await this.repo.findOneByOrFail({ id: userId });

        // Get recipe counts using TypeORM Repository queries
        const [
            recipesCreated,
            recipesFavorited,
            recipesCooked,
            recipesInQueue
        ] = await Promise.all([
            // Count created recipes (only community recipes owned by the user)
            this.recipeRepo.count({
                where: { 
                    owner: { id: userId },
                    source: 'community'
                }
            }),
            
            // Count favorited recipes
            this.favoriteRepo.count({
                where: { user: { id: userId } }
            }),
            
            // Count cooked recipes
            this.cookedRepo.count({
                where: { user: { id: userId } }
            }),
            
            // Count recipes in queue
            this.queueRepo.count({
                where: { user: { id: userId } }
            })
        ]);

        return {
            recipesCreated,
            recipesFavorited,
            recipesCooked,
            recipesInQueue
        };
    }
}
