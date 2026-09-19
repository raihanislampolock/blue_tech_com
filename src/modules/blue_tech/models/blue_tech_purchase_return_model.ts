import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";

import { BlueTechPurchaseModel } from "./blue_tech_purchase_model";
import { BlueTechPurchaseReturnItemModel } from "./blue_tech_purchase_return_item_model";

@Entity("blue_tech_purchase_returns")
export class BlueTechPurchaseReturnModel {

    @PrimaryGeneratedColumn()
    id!: number;

    // Return Number
    @Column({
        type: "varchar",
        length: 50,
        unique: true,
    })
    returnNumber!: string;

    // Original Purchase
    @Column({
        type: "int",
    })
    purchaseId!: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    supplierName?: string | null;

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
    creditAmount!: number;

    @Column({
        type: "varchar",
        length: 30,
        nullable: true,
    })
    creditStatus?: string | null;
    // NONE | PENDING | RECEIVED | CREDITED

    @Column({
        type: "varchar",
        length: 30,
        nullable: true,
    })
    creditMethod?: string | null;
    // CASH | BANK | SUPPLIER_CREDIT | ORIGINAL_PAYMENT

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

    // Original Purchase
    @ManyToOne(
        () => BlueTechPurchaseModel,
        {
            nullable: false,
        }
    )
    @JoinColumn({
        name: "purchaseId",
    })
    purchase!: BlueTechPurchaseModel;


    // Returned Items
    @OneToMany(
        () => BlueTechPurchaseReturnItemModel,
        returnItem => returnItem.purchaseReturn,
        {
            cascade: true,
        }
    )
    items?: BlueTechPurchaseReturnItemModel[];
}
