import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PantryItem } from './pantry.entity';
import { Repository } from 'typeorm';
import { CreatePantryItemDto } from './dto/create-pantry-item.dto';
import { UpdatePantryItemDto } from './dto/update-pantry-item.dto';
import { User } from '../users/user.entity';

@Injectable()
export class PantryService {
    constructor(
        @InjectRepository(PantryItem) private readonly pantryRepo: Repository<PantryItem>,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
    ) {}

    async list(
        userId: string,
        page = 1,
        limit = 10,
        opts?: { q?: string; sortBy?: 'createdAt'|'name'|'expiresAt'; order?: 'ASC'|'DESC'; expiringWithin?: number }
    ) {
        const qb = this.pantryRepo.createQueryBuilder('p')
            .where('p.userId = :userId', { userId });

        if (opts?.q) {
            qb.andWhere('LOWER(p.name) LIKE :q', { q: `%${opts.q.toLowerCase()}%` });
        }
        if (typeof opts?.expiringWithin === 'number') {
            qb.andWhere('p.expiresAt IS NOT NULL AND p.expiresAt <= :deadline', {
                deadline: new Date(Date.now() + opts.expiringWithin * 24 * 3600 * 1000),
            });
        }

        const sortBy = opts?.sortBy ?? 'createdAt';
        const order = opts?.order ?? 'DESC';
        qb.orderBy(`p.${sortBy}`, order as 'ASC'|'DESC');

        qb.skip((page - 1) * limit).take(limit);

        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, pageSize: limit };
    }


    async create(userId: string, dto: CreatePantryItemDto) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        const entity = this.pantryRepo.create({
            user,
            name: dto.name,
            quantity: dto.quantity ?? null,
            unit: dto.unit ?? null,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        });
        return this.pantryRepo.save(entity);
    }

    async update(userId: string, itemId: string, dto: UpdatePantryItemDto) {
        const item = await this.pantryRepo.findOne({ where: { id: itemId }, relations: { user: true } });
        if (!item || item.user?.id !== userId) throw new NotFoundException('Pantry item not found');

        if (dto.name !== undefined) item.name = dto.name;
        if (dto.quantity !== undefined) item.quantity = dto.quantity ?? null;
        if (dto.unit !== undefined) item.unit = dto.unit ?? null;
        if (dto.expiresAt !== undefined) item.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

        return this.pantryRepo.save(item);
    }

    async remove(userId: string, itemId: string) {
        const item = await this.pantryRepo.findOne({ where: { id: itemId }, relations: { user: true } });
        if (!item || item.user?.id !== userId) throw new NotFoundException('Pantry item not found');
        await this.pantryRepo.delete(item.id);
        return { deleted: true };
    }
}
