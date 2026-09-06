import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("blue_tech_items")
export class BlueTechItemsModel {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 50, nullable: true })
    itemType!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    manufactureOrigin!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    itemName!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    itemPrice!: string;

    @Column({ type: "text", nullable: true })
    itemConfigurations!: string;

    @Column({ type: "varchar", length: 255, nullable: true })
    imeiNumber!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    createdBy!: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    updatedBy!: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

}