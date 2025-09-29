import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';

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
}
