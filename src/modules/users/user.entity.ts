import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ unique: true })
    email!: string;

    @Column()
    @Exclude()
    password!: string;

    @Column({ nullable: true })
    display_name?: string;

    @Column({ nullable: true })
    avatar_url?: string;

    @Column({ type: 'text', nullable: true })
    bio?: string;

    @CreateDateColumn()
    created_at!: Date;
}
