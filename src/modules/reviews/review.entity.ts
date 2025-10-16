import {Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn} from 'typeorm';
import { Recipe } from '../recipes/entities/recipe.entity';
import { User } from '../users/user.entity';

/**
 * Multiple reviews per (user, recipe). Rating 1..5.
 */
@Entity('recipe_review')
@Index('IDX_recipe_review_recipe', ['recipe'])
@Index('IDX_recipe_review_user', ['user'])
export class RecipeReview {
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @ManyToOne(() => Recipe, (r) => r.id, { onDelete: 'CASCADE', eager: false })
    recipe?: Recipe;

    @ManyToOne(() => User, (u) => u.id, { onDelete: 'CASCADE', eager: false })
    user?: User;

    @Column({ type: 'int', nullable: true })
    rating?: number | null; // 1..5

    @Column({ type: 'text', nullable: true })
    content?: string | null;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt?: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt?: Date;
}
