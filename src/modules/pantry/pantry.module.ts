import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PantryItem } from './pantry.entity';
import { PantryService } from './pantry.service';
import { PantryController } from './pantry.controller';
import { User } from '../users/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([PantryItem, User])],
    providers: [PantryService],
    controllers: [PantryController],
    exports: [PantryService],
})
export class PantryModule {}
