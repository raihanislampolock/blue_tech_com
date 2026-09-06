import { Transform } from "class-transformer";
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Timestamp } from "typeorm";

@Entity("email_config")
export class EmailConfigModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 50 })
    type: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    email: string | null;

    @Column({ type: 'varchar', length: 255 })
    appPassword: string;

    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: "varchar", nullable: true })
    createdBy: string | null;

    @Column({ type: "varchar", nullable: true })
    updatedBy: number | null;
}