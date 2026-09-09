import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("blue_tech_supplier_payments")
export class BlueTechSupplierPaymentModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 255 })
    supplierName!: string;

    @Column({ type: "numeric", precision: 14, scale: 2 })
    amount!: string;

    @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
    allocatedAmount!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    paymentMethod!: string | null;

    @Column({ type: "text", nullable: true })
    notes!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    createdBy!: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
