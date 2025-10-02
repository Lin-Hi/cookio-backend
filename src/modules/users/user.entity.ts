import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column({ nullable: true })
    display_name?: string;

    @Column({ nullable: true })
    avatar_url?: string;

    @CreateDateColumn()
    created_at!: Date;
}
