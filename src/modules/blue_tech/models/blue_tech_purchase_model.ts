import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { BlueTechPurchaseItemModel } from "./blue_tech_purchase_item_model";

@Entity("blue_tech_purchases")
export class BlueTechPurchaseModel {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 50 })
    purchaseNumber!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    supplierName!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    imeiNumber!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    qty!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    purchasesPrice!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    advancePayment!: string | null;

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

    @OneToMany(() => BlueTechPurchaseItemModel, i => i.purchase)
    items?: BlueTechPurchaseItemModel[];
}

