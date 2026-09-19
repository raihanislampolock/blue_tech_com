import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

import { BlueTechPurchaseReturnModel } from "./blue_tech_purchase_return_model";
import { BlueTechPurchaseItemModel } from "./blue_tech_purchase_item_model";
import { BlueTechItemsModel } from "./blue_tech_item_model";

@Entity("blue_tech_purchase_return_items")
export class BlueTechPurchaseReturnItemModel {

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
    // Original Purchase Item
    // ==========================================

    @Column({
        type: "int",
    })
    purchaseItemId!: number;


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
    // Original Purchase Price
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
        () => BlueTechPurchaseReturnModel,
        purchaseReturn => purchaseReturn.items,
        {
            onDelete: "CASCADE",
        }
    )
    @JoinColumn({
        name: "returnId",
    })
    purchaseReturn!: BlueTechPurchaseReturnModel;


    @ManyToOne(
        () => BlueTechPurchaseItemModel,
        {
            nullable: false,
        }
    )
    @JoinColumn({
        name: "purchaseItemId",
    })
    purchaseItem!: BlueTechPurchaseItemModel;


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
