import {Inject, Injectable} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { User } from './user.entity';
import {InjectRepository} from "@nestjs/typeorm";

@Injectable()
export class AppService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @Inject('REDIS_CLIENT')
        private readonly redis: Redis,
    ) {}

    async getHello(): Promise<string> {
        // 确保数据库里有一个 user
        const existing = await this.userRepo.findOne({ where: { userId: '123456' } });
        if (!existing) {
            const user = this.userRepo.create({ userId: '123456' });
            await this.userRepo.save(user);
        }

        // 从数据库读取
        const user = await this.userRepo.findOne({ where: { userId: '123456' } });

        // 同时写一份缓存
        await this.redis.set('lastUser', user?.userId ?? 'none');

        // 从 Redis 取回验证
        const cached = await this.redis.get('lastUser');

        return `Hello User with ID: ${user?.userId} (cached: ${cached})`;
    }
}
