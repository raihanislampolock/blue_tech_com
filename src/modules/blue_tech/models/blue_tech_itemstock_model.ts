import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Unique } from "typeorm";
import { BlueTechItemsModel } from "./blue_tech_item_model";

@Entity("blue_tech_item_stocks")
@Unique(["itemId"])
export class BlueTechItemStockModel {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int", nullable: true })
    itemId!: number;

    @Column({ type: "int", nullable: true })
    onHandQuantity!: number;

    @Column({ type: "int", nullable: true })
    reservedQuantity!: number;

    @Column({ type: "int", nullable: true })
    availableQuantity!: number;

    @Column({ type: "varchar", length: 500, nullable: true })
    lastPurchasePrice!: string | null;

    @Column({ type: "varchar", length: 255, nullable: true })
    lastPurchaseDate!: Date | null;

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

    @ManyToOne(() => BlueTechItemsModel, { eager: true })
    @JoinColumn({ name: "itemId" })
    item?: BlueTechItemsModel;

}
