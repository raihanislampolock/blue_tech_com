import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("blue_tech_supplier_payment_allocations")
export class BlueTechSupplierPaymentAllocationModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    supplierPaymentId!: number;

    @Column()
    purchaseId!: number;

    @Column({ type: "numeric", precision: 14, scale: 2 })
    amount!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    createdBy!: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
