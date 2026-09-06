import { Exclude } from "class-transformer";
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique
} from "typeorm";

@Entity("appointment_providers")
export class ProviderModel {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "varchar", length: 50 })
    userId: string;

    @Column({ type: "varchar", length: 50 })
    serviceId: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column({ type: "int", nullable: true })
    createdBy: number | null;

    @Column({ type: "int", nullable: true })
    updatedBy: number | null;
}
