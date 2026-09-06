import { BlueTechSupplierModel } from "../models/blue_tech_supplier_model";

export interface IBlueTechSupplier {
    id: number;
    supplierName: string;
    supplierEmail: string;
    supplierNumber: string;
    note: string;
    supplierAddress: string;
    createdBy?: string;
    updatedBy?: string;
    created_at: Date;
    updated_at: Date;
}

export interface IBlueTechSupplierRepository {
    create(blueTechSupplierData: IBlueTechSupplier): Promise<BlueTechSupplierModel>;

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: IBlueTechSupplier[]; total: number }>;

    edit(id: number): Promise<IBlueTechSupplier | null>;
    update(id: number, updateData: Partial<IBlueTechSupplier>): Promise<any>;
}