import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { User } from '../../users/user.entity';

@Index('uq_recipe_source_sourceId', ['source', 'sourceId'], { unique: true })
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

    // Source of the recipe. Default 'community' keeps existing data intact.
    @Column({ type: 'varchar', length: 32, default: 'community' })
    source!: 'community' | 'edamam' | 'spoonacular';

    // External provider id (e.g., Edamam uri/hash or Spoonacular id). Nullable for community recipes.
    @Column({ type: 'varchar', length: 191, nullable: true })
    sourceId!: string | null;

    // Optional but handy for UI/backfill
    @Column({ type: 'text', nullable: true })
    sourceUrl!: string | null;

    @Column({ type: 'jsonb', nullable: true })
    sourceData!: any | null;
}
