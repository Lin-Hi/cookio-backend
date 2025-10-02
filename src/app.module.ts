import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisProvider } from './redis.provider';

import { UsersModule } from './modules/users/users.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { User } from './modules/users/user.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: process.env.DATABASE_HOST || 'localhost',
            port: Number(process.env.DATABASE_PORT) || 5432,
            username: process.env.DATABASE_USER || 'postgres',
            password: process.env.DATABASE_PASSWORD || 'postgres',
            database: process.env.DATABASE_NAME || 'appdb',
            autoLoadEntities: true,
            synchronize: true, // dev only
        }),
        TypeOrmModule.forFeature([User]),

        UsersModule,
        RecipesModule,
    ],
    controllers: [AppController],
    providers: [AppService, RedisProvider],
})
export class AppModule {}
