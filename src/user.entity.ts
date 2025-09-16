import { Entity, PrimaryColumn } from 'typeorm';

// 避免用保留字 "user"，改成 "users"
@Entity({ name: 'users' })
export class User {
    // 显式指定列类型，避免反射成 Object
    @PrimaryColumn({ type: 'varchar', length: 30 })
    userId!: string;
}
