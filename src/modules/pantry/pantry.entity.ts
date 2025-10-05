import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('pantry_items')
@Index(['user'])
export class PantryItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, { eager: false, nullable: false, onDelete: 'CASCADE' })
    user?: User;

    @Column({ type: 'varchar', length: 150 })
    name?: string;

    @Column({ type: 'varchar', length: 80, nullable: true })
    quantity?: string | null;

    @Column({ type: 'varchar', length: 40, nullable: true })
    unit?: string | null;

    @Column({ type: 'date', nullable: true })
    expiresAt?: Date | null;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;
}
