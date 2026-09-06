import { BlueTechPaymentMethodModel } from "../models/blue_tech_payment_method_model";

export interface IBlueTechPaymentMethod {
    id: number;
    paymentMethodName: string;
    paymentMethodDescription: string;
    createdBy?: string;
    updatedBy?: string;
    created_at: Date;
    updated_at: Date;
}

export interface IBlueTechPaymentMethodRepository {
    create(blueTechPaymentMethodData: IBlueTechPaymentMethod): Promise<BlueTechPaymentMethodModel>;

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: IBlueTechPaymentMethod[]; total: number }>;

    edit(id: number): Promise<IBlueTechPaymentMethod | null>;
    update(id: number, updateData: Partial<IBlueTechPaymentMethod>): Promise<any>;
}