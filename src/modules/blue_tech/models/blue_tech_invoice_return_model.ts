import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";

import { BlueTechInvoiceModel } from "./blue_tech_invoice_modal";
import { BlueTechCustomerModel } from "./blue_tech_customer_model";
import { BlueTechInvoiceReturnItemModel } from "../models/blue_tech_invoice_return_item_model";

@Entity("blue_tech_invoice_returns")
export class BlueTechInvoiceReturnModel {

    @PrimaryGeneratedColumn()
    id!: number;

    // Return Number
    @Column({
        type: "varchar",
        length: 50,
        unique: true,
    })
    returnNumber!: string;

    // Original Invoice
    @Column({
        type: "int",
    })
    invoiceId!: number;

    // Customer
    @Column({
        type: "int",
        nullable: true,
    })
    customerId?: number | null;

    // Date of Return
    @Column({
        type: "date",
        default: () => "CURRENT_DATE",
    })
    returnDate!: Date;

    // Return Status
    @Column({
        type: "varchar",
        length: 30,
        default: "COMPLETED",
    })
    returnStatus!: string;
    // DRAFT | COMPLETED | CANCELLED

    // Reason for overall return
    @Column({
        type: "text",
        nullable: true,
    })
    reason?: string | null;

    // Refund / Credit information
    @Column({
        type: "decimal",
        precision: 12,
        scale: 2,
        default: 0,
    })
    subtotal!: number;

    @Column({
        type: "decimal",
        precision: 12,
        scale: 2,
        default: 0,
    })
    refundAmount!: number;

    @Column({
        type: "varchar",
        length: 30,
        nullable: true,
    })
    refundStatus?: string | null;
    // NONE | PENDING | REFUNDED | CREDITED

    @Column({
        type: "varchar",
        length: 30,
        nullable: true,
    })
    refundMethod?: string | null;
    // CASH | CARD | BANK | CUSTOMER_CREDIT | ORIGINAL_PAYMENT

    // Notes
    @Column({
        type: "text",
        nullable: true,
    })
    notes?: string | null;

    // User who created the return
    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
    })
    createdBy?: string | null;

    // User who updated the return
    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
    })
    updatedBy?: string | null;

    // Created / Updated timestamps
    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;


    // ==========================================
    // Relations
    // ==========================================

    // Original Invoice
    @ManyToOne(
        () => BlueTechInvoiceModel,
        {
            nullable: false,
        }
    )
    @JoinColumn({
        name: "invoiceId",
    })
    invoice!: BlueTechInvoiceModel;


    // Customer
    @ManyToOne(
        () => BlueTechCustomerModel,
        {
            nullable: true,
        }
    )
    @JoinColumn({
        name: "customerId",
    })
    customer?: BlueTechCustomerModel;


    // Returned Items
    @OneToMany(
        () => BlueTechInvoiceReturnItemModel,
        returnItem => returnItem.invoiceReturn,
        {
            cascade: true,
        }
    )
    items?: BlueTechInvoiceReturnItemModel[];
}