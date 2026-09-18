import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { BlueTechCustomerAdvanceModel } from "./blue_tech_customer_advance_model";
import { BlueTechInvoiceModel } from "./blue_tech_invoice_modal";

@Entity("blue_tech_customer_advance_allocations")
export class BlueTechCustomerAdvanceAllocationModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    advanceId!: number;

    @Column({ type: "int" })
    invoiceId!: number;

    @Column({ type: "numeric", precision: 14, scale: 2 })
    amount!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    createdBy?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @ManyToOne(() => BlueTechCustomerAdvanceModel, advance => advance.allocations, { onDelete: "CASCADE" })
    @JoinColumn({ name: "advanceId" })
    advance!: BlueTechCustomerAdvanceModel;

    @ManyToOne(() => BlueTechInvoiceModel, invoice => invoice.advanceAllocations, { onDelete: "CASCADE" })
    @JoinColumn({ name: "invoiceId" })
    invoice!: BlueTechInvoiceModel;
}
