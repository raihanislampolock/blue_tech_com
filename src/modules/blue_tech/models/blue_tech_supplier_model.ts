import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("blue_tech_supplier")
export class BlueTechSupplierModel {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 50 })
    supplierName!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    supplierEmail!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    supplierNumber!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    supplierAddress!: string | null;

    @Column({ type: "text", nullable: true })
    note!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    createdBy!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    updatedBy!: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;
}