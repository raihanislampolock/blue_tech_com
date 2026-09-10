import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BlueTechPurchaseOrderItemModel } from "./blue_tech_purchase_order_item_model";

@Entity("blue_tech_purchases_order")
export class BlueTechPurchaseOrderModel {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 50 })
    purchaseOrderNumber!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    supplierName!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    imeiNumber!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    qty!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    purchasesOrderPrice!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    advancePayment!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true, default: "0" })
    settledPayment!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    duePayment!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    paymentMethod!: string | null;

    @Column({ type: "varchar", length: 500, nullable: true })
    notes!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    createdBy!: string | null;

    @Column({ type: "varchar", length: 50, nullable: true })
    updatedBy!: string | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @OneToMany(() => BlueTechPurchaseOrderItemModel, i => i.purchaseorder)
    items?: BlueTechPurchaseOrderItemModel[];
}

