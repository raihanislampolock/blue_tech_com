import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BlueTechInvoiceModel } from "./blue_tech_invoice_modal";
import { BlueTechItemsModel } from "./blue_tech_item_model";

@Entity("blue_tech_invoice_items")
export class BlueTechInvoiceItemModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ name: "invoiceId", type: "int" })
    invoiceId!: number;

    @Column({ name: "itemId", type: "int" })
    itemId!: number;

    @Column({ name: "quantity", type: "int" })
    quantity!: number;

    @Column({ name: "unitPrice", type: "decimal", precision: 12, scale: 2 })
    unitPrice!: number;

    @Column({ name: "totalPrice", type: "decimal", precision: 12, scale: 2 })
    totalPrice!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    itemDiscountAmount!: number;

    @Column({ type: "decimal", precision: 12, scale: 2, default: 0 })
    taxAmount!: number;

    @Column({ type: "int", nullable: true })
    purchaseItemId?: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    itemNameSnapshot?: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    imeiNumber?: string;

    @Column({ name: "notes", type: "text", nullable: true })
    notes?: string;

    @Column({ name: "createdBy", type: "varchar", length: 255, nullable: true })
    createdBy?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    // Relations
    @ManyToOne(() => BlueTechInvoiceModel, invoice => invoice.items, { onDelete: "CASCADE" })
    @JoinColumn({ name: "invoiceId" })
    invoice!: BlueTechInvoiceModel;

    @ManyToOne(() => BlueTechItemsModel, { nullable: true })
    @JoinColumn({ name: "itemId" })
    item?: BlueTechItemsModel;
}