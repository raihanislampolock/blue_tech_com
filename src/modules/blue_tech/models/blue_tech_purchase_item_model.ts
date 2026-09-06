import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BlueTechPurchaseModel } from "./blue_tech_purchase_model";
import { BlueTechItemsModel } from "./blue_tech_item_model";

@Entity("blue_tech_purchase_items")
export class BlueTechPurchaseItemModel {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int", nullable: true })
    purchaseId!: number;

    @Column({ type: "int", nullable: true })
    itemId!: number;

    @Column({ type: "int", nullable: true })
    quantity!: number;

    @Column({ type: "varchar", length: 255, nullable: true })
    unitPrice!: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    totalPrice!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    notes!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    createdBy!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    updatedBy!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @ManyToOne(() => BlueTechPurchaseModel, purchase => purchase.items, { onDelete: "CASCADE" })
    @JoinColumn({ name: "purchaseId" })
    purchase!: BlueTechPurchaseModel;

    @ManyToOne(() => BlueTechItemsModel, { eager: true })
    @JoinColumn({ name: "itemId" })
    item?: BlueTechItemsModel;

}