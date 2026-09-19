import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

import { BlueTechInvoiceReturnModel } from "./blue_tech_invoice_return_model";
import { BlueTechInvoiceItemModel } from "./blue_tech_invoice_item_modal";
import { BlueTechItemsModel } from "./blue_tech_item_model";

@Entity("blue_tech_invoice_return_items")
export class BlueTechInvoiceReturnItemModel {

    @PrimaryGeneratedColumn()
    id!: number;


    // ==========================================
    // Return
    // ==========================================

    @Column({
        type: "int",
    })
    returnId!: number;


    // ==========================================
    // Original Invoice Item
    // ==========================================

    @Column({
        type: "int",
    })
    invoiceItemId!: number;


    // ==========================================
    // Item
    // ==========================================

    @Column({
        type: "int",
    })
    itemId!: number;


    // ==========================================
    // Quantity Returned
    // ==========================================

    @Column({
        type: "int",
    })
    quantity!: number;


    // ==========================================
    // Original Selling Price
    // ==========================================

    @Column({
        type: "decimal",
        precision: 12,
        scale: 2,
    })
    unitPrice!: number;


    // ==========================================
    // Return Total
    // ==========================================

    @Column({
        type: "decimal",
        precision: 12,
        scale: 2,
    })
    totalPrice!: number;


    // ==========================================
    // Item Snapshot
    // ==========================================

    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
    })
    itemNameSnapshot?: string | null;


    // ==========================================
    // IMEI
    // ==========================================

    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
    })
    imeiNumber?: string | null;


    // ==========================================
    // Return Reason
    // ==========================================

    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
    })
    returnReason?: string | null;


    // ==========================================
    // Item Condition
    // ==========================================

    @Column({
        type: "varchar",
        length: 50,
        nullable: true,
    })
    itemCondition?: string | null;
    // GOOD | DAMAGED | DEFECTIVE | USED


    // ==========================================
    // Stock Action
    // ==========================================

    @Column({
        type: "varchar",
        length: 30,
        default: "RESTOCK",
    })
    stockAction!: string;
    // RESTOCK | DAMAGED | SCRAP


    // ==========================================
    // Notes
    // ==========================================

    @Column({
        type: "text",
        nullable: true,
    })
    notes?: string | null;


    // ==========================================
    // Created / Updated
    // ==========================================

    @Column({
        type: "varchar",
        length: 255,
        nullable: true,
    })
    createdBy?: string | null;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;


    // ==========================================
    // Relations
    // ==========================================

    @ManyToOne(
        () => BlueTechInvoiceReturnModel,
        invoiceReturn => invoiceReturn.items,
        {
            onDelete: "CASCADE",
        }
    )
    @JoinColumn({
        name: "returnId",
    })
    invoiceReturn!: BlueTechInvoiceReturnModel;


    @ManyToOne(
        () => BlueTechInvoiceItemModel,
        {
            nullable: false,
        }
    )
    @JoinColumn({
        name: "invoiceItemId",
    })
    invoiceItem!: BlueTechInvoiceItemModel;


    @ManyToOne(
        () => BlueTechItemsModel,
        {
            nullable: false,
        }
    )
    @JoinColumn({
        name: "itemId",
    })
    item!: BlueTechItemsModel;
}