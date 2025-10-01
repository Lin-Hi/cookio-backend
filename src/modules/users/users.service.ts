import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
        if (exist) return exist;
        const u = this.repo.create(dto);
        return this.repo.save(u);
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
