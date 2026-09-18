import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { BlueTechInvoiceModel } from "./blue_tech_invoice_modal";
import { BlueTechCustomerAdvanceModel } from "./blue_tech_customer_advance_model";

@Entity("blue_tech_customers")
export class BlueTechCustomerModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 255 })
    customerName!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    phoneNumber?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    email?: string;

    @Column({ type: "varchar", length: 100, nullable: true })
    taxNumber?: string;

    @Column({ type: "text", nullable: true })
    billingAddress?: string;

    @Column({ type: "text", nullable: true })
    notes?: string;

    @Column({ type: "boolean", default: true })
    isActive!: boolean;

    @Column({ type: "varchar", length: 50, nullable: true })
    createdBy?: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    updatedBy?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => BlueTechInvoiceModel, invoice => invoice.customer)
    invoices?: BlueTechInvoiceModel[];

    @OneToMany(() => BlueTechCustomerAdvanceModel, advance => advance.customer)
    advances?: BlueTechCustomerAdvanceModel[];
}
