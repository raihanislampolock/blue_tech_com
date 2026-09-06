import { Exclude } from "class-transformer";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique
} from "typeorm";

@Entity("users")
@Unique(["empId"])
export class UserModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 50 })
    userId: string;

    @Column({ type: "varchar", length: 50 })
    username: string;

    @Column({ type: "varchar", length: 10 })
    empId: string;

    @Exclude()
    @Column({ type: "varchar", length: 255 })
    password: string;

    @Column({ type: "varchar", length: 50 })
    roleId: string;

    @Column({ type: "varchar", length: 5, nullable: true })
    gender: string | null;

    @Column({ type: "date", nullable: true })
    dateOfBirth: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    email: string | null;

    @Column({ type: "varchar", length: 15 })
    phone: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    address: string | null;

    @Column({ type: "varchar", length: 500, nullable: true })
    files!: string;

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

    @Column({ type: "varchar", nullable: true })
    createdBy: string | null;

    @Column({ type: "int", nullable: true })
    updatedBy: number | null;
}
