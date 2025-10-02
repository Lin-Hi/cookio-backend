import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Entity({ name: 'recipes' })
export class Recipe {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner!: User;

    @Column()
    title!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ nullable: true })
    image_url?: string;

    @Column({ nullable: true })
    category?: string;

    @Column({ nullable: true })
    difficulty?: string;

    @Column({ nullable: true })
    cook_time?: string;

    @Column({ type: 'int', nullable: true })
    servings?: number;

    @Column({ default: false })
    is_published!: boolean;

    @CreateDateColumn()
    created_at!: Date;

    @UpdateDateColumn()
    updated_at!: Date;
}
