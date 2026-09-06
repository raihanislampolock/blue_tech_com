import { Exclude } from "class-transformer";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique
} from "typeorm";

@Entity("permission")
export class PermissionModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 50 })
    permissionId: string;

    @Column({ type: "varchar", length: 50 })
    name: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    slug: string | null;

    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: "timestamp", nullable: true })
    inactiveAt: Date | null;

    @Column({ type: "int", nullable: true })
    inactiveBy: number | null;

    @Column({ type: "int", nullable: true })
    createdBy: number | null;

    @Column({ type: "int", nullable: true })
    updatedBy: number | null;
}