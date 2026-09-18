import { BlueTechCustomerModel } from "../models/blue_tech_customer_model";

export interface IBlueTechCustomer {
    id?: number;
    customerName: string;
    phoneNumber?: string | null;
    email?: string | null;
    taxNumber?: string | null;
    billingAddress?: string | null;
    notes?: string | null;
    isActive?: boolean;
    createdBy?: string | null;
    updatedBy?: string | null;
    created_at?: Date;
    updated_at?: Date;
}

export interface IBlueTechCustomerRepository {
    create(data: IBlueTechCustomer): Promise<BlueTechCustomerModel>;
    getAll(search: string, page: number, limit: number): Promise<{ data: IBlueTechCustomer[]; total: number; totalPages: number; currentPage: number }>;
    edit(id: number): Promise<IBlueTechCustomer | null>;
    update(id: number, data: Partial<IBlueTechCustomer>): Promise<any>;
}
