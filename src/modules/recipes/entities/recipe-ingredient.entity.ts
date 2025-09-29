import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Recipe } from './recipe.entity';

@Entity({ name: 'recipe_ingredients' })
export class RecipeIngredient {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Recipe, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'recipe_id' })
    recipe!: Recipe;

    @Column()
    name!: string;

    @Column({ nullable: true })
    quantity?: string;

    @Column({ nullable: true })
    unit?: string;

    @Column({ type: 'int', default: 0 })
    position!: number;
}
