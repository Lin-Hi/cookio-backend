import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Recipe } from '../recipes/entities/recipe.entity';

@Entity('favorites')
@Unique(['user', 'recipe']) // prevent duplicate favorites
export class Favorite {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    user!: User;

    @ManyToOne(() => Recipe, { onDelete: 'CASCADE' })
    recipe!: Recipe;

    @CreateDateColumn()
    created_at!: Date;
}
