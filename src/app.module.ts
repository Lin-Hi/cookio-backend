import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisProvider } from './redis.provider';
import { User } from './user.entity';

@Module({
    imports: [
        // postgresql
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: Number(process.env.DATABASE_PORT) || 5432,
            username: process.env.DATABASE_USER || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || 'appdb',
            entities: [User], // 注册实体
            synchronize: true, // 开发阶段自动建表
        }),
        TypeOrmModule.forFeature([User]), // 在 Service 中注入 Repository
    ],
    controllers: [AppController],
    providers: [AppService, RedisProvider],
})
export class AppModule {}
