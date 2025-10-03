import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { User } from './modules/users/user.entity';

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

        // ensure there is a demo user in the database (by email)
        let user = await this.userRepo.findOne({ where: { email: DEMO_EMAIL } });
        if (!user) {
            user = this.userRepo.create({
                email: DEMO_EMAIL,
                display_name: 'Demo User',
                password: '123456',
            });
            user = await this.userRepo.save(user);
        }

        // write to Redis
        await this.redis.set('lastUserEmail', user.email);

        const cached = await this.redis.get('lastUserEmail');

        // return string with user id and cached email
        return `Hello User ${user.display_name ?? user.email} (id: ${user.id}, cached: ${cached})`;
    }
}
