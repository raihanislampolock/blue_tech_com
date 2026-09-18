import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { BlueTechCustomerModel } from "./blue_tech_customer_model";
import { BlueTechPaymentMethodModel } from "./blue_tech_payment_method_model";
import { BlueTechCustomerAdvanceAllocationModel } from "./blue_tech_customer_advance_allocation_model";

@Entity("blue_tech_customer_advances")
export class BlueTechCustomerAdvanceModel {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "int" })
    customerId!: number;

    @Column({ type: "varchar", length: 50, unique: true })
    advanceNumber!: string;

    @Column({ type: "numeric", precision: 14, scale: 2 })
    amount!: string;

    @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
    allocatedAmount!: string;

    @Column({ type: "numeric", precision: 14, scale: 2, default: 0 })
    remainingAmount!: string;

    @Column({ type: "varchar", length: 30, default: "OPEN" })
    status!: string; // OPEN | PARTIALLY_USED | USED | REFUNDED | CANCELLED

    @Column({ type: "int", nullable: true })
    paymentMethodId?: number;

    @Column({ type: "date", default: () => "CURRENT_DATE" })
    receivedDate!: Date;

    @Column({ type: "text", nullable: true })
    notes?: string;

    @Column({ type: "varchar", length: 50, nullable: true })
    createdBy?: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @ManyToOne(() => BlueTechCustomerModel, customer => customer.advances, { nullable: false })
    @JoinColumn({ name: "customerId" })
    customer!: BlueTechCustomerModel;

    @ManyToOne(() => BlueTechPaymentMethodModel, { nullable: true })
    @JoinColumn({ name: "paymentMethodId" })
    paymentMethod?: BlueTechPaymentMethodModel;

    @OneToMany(() => BlueTechCustomerAdvanceAllocationModel, allocation => allocation.advance)
    allocations?: BlueTechCustomerAdvanceAllocationModel[];
}
