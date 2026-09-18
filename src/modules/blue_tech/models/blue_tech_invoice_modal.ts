import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BlueTechCustomerModel } from "./blue_tech_customer_model";
import { BlueTechInvoiceItemModel } from "./blue_tech_invoice_item_modal";
import { BlueTechPaymentMethodModel } from "./blue_tech_payment_method_model";
import { BlueTechCustomerAdvanceAllocationModel } from "./blue_tech_customer_advance_allocation_model";

@Entity("blue_tech_invoices")
export class BlueTechInvoiceModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 50, unique: true })
    invoiceNumber!: string;

    @Column({ type: "int", nullable: true })
    customerId?: number;

    @Column({ type: "date", default: () => "CURRENT_DATE" })
    invoiceDate!: Date;

    @Column({ type: "date", nullable: true })
    dueDate?: Date | null;

    @Column({ type: "varchar", length: 30, default: "DRAFT" })
    invoiceStatus!: string; // DRAFT | ISSUED | PARTIALLY_PAID | PAID | CANCELLED

    @Column({ type: "varchar", length: 30, default: "UNPAID" })
    paymentStatus!: string; // UNPAID | PARTIALLY_PAID | PAID

    @Column({ type: "int", nullable: true })
    paymentMethodId?: number | null;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    subtotal!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    discountAmount!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    totalAmount!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    paidAmount!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    advanceAmountApplied!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    dueAmount!: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    customerNameSnapshot?: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    customerPhoneSnapshot?: string;

    @Column({ type: "text", nullable: true })
    billingAddressSnapshot?: string;

    @Column({ type: "text", nullable: true })
    notes?: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    createdBy?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    updatedBy?: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => BlueTechCustomerModel, customer => customer.invoices, { nullable: true })
    @JoinColumn({ name: "customerId" })
    customer?: BlueTechCustomerModel;

    @ManyToOne(() => BlueTechPaymentMethodModel, { nullable: true })
    @JoinColumn({ name: "paymentMethodId" })
    paymentMethod?: BlueTechPaymentMethodModel;

    @OneToMany(() => BlueTechInvoiceItemModel, invoiceItem => invoiceItem.invoice, { cascade: true })
    items?: BlueTechInvoiceItemModel[];

    @OneToMany(() => BlueTechCustomerAdvanceAllocationModel, allocation => allocation.invoice)
    advanceAllocations?: BlueTechCustomerAdvanceAllocationModel[];
}