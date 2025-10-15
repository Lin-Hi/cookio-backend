import { Entity, PrimaryGeneratedColumn, ManyToOne, Unique, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Recipe } from '../recipes/entities/recipe.entity';

@Entity('queue_items')
@Unique('uq_queue_user_recipe', ['user', 'recipe']) // English: idempotent queue
export class QueueItem {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    user?: User;

    @ManyToOne(() => Recipe, { nullable: false, onDelete: 'CASCADE' })
    recipe?: Recipe;

    @CreateDateColumn()
    created_at?: Date;
}
