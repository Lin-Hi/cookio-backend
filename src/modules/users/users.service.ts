import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User) private readonly repo: Repository<User>,
    ) {}

    async create(dto: CreateUserDto) {
        const exist = await this.repo.findOne({ where: { email: dto.email } });
        if (exist) {
            throw new ConflictException('该邮箱已被注册');
        }
        
        // 加密密码
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        
        const u = this.repo.create({
            ...dto,
            password: hashedPassword,
        });
        
        const savedUser = await this.repo.save(u);
        
        // 返回时排除密码
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
}
