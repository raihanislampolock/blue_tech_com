import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("blue_tech_stock_movements")
export class BlueTechStockMovementModel {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    itemId!: number;

    @Column()
    quantity!: number;

    @Column()
    movementType!: string;
    // PURCHASE | SALE | ADJUSTMENT

    @Column()
    referenceId!: number; // purchaseId / saleId

    @Column({ nullable: true })
    note!: string;

    @CreateDateColumn()
    createdAt!: Date;
}