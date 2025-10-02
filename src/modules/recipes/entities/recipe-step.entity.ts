import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity({ name: 'recipe_steps' })
@Unique(['recipe', 'step_no'])
export class RecipeStep {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Recipe, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recipe_id' })
    recipe!: Recipe;

    @Column({ type: 'int' })
    step_no!: number;

    @Column({ type: 'text' })
    content!: string;

    @Column({ nullable: true })
    image_url?: string;
}
