import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
// 任选其一：根据你实体文件的实际位置修改
import { User } from './modules/users/user.entity';
// import { User } from './user.entity';

@Injectable()
export class AppService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @Inject('REDIS_CLIENT')
        private readonly redis: Redis,
    ) {}

    async getHello(): Promise<string> {
        const DEMO_EMAIL = 'demo@cookio.app';

        // 1) 确保数据库里有一条示例用户（按 email）
        let user = await this.userRepo.findOne({ where: { email: DEMO_EMAIL } });
        if (!user) {
            user = this.userRepo.create({
                email: DEMO_EMAIL,
                display_name: 'Demo User',
            });
            user = await this.userRepo.save(user);
        }

        // 2) 同步写入 Redis（演示缓存）
        await this.redis.set('lastUserEmail', user.email);

        const cached = await this.redis.get('lastUserEmail');

        // 3) 返回字符串（包含 id 与缓存验证）
        return `Hello User ${user.display_name ?? user.email} (id: ${user.id}, cached: ${cached})`;
    }
}
