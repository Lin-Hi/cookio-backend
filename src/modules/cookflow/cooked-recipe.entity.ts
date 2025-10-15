import { Entity, PrimaryGeneratedColumn, ManyToOne, Index, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Recipe } from '../recipes/entities/recipe.entity';

@Entity('cooked_recipes')
@Index(['user', 'cooked_at'])
export class CookedRecipe {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    user!: User;

    @ManyToOne(() => Recipe, { nullable: false, onDelete: 'CASCADE' })
    recipe!: Recipe;

    @CreateDateColumn()
    cooked_at!: Date;
}
