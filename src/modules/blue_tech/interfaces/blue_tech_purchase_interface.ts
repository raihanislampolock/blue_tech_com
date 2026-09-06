import { BlueTechPurchaseItemModel } from "../models/blue_tech_purchase_item_model";
import { BlueTechPurchaseModel } from "../models/blue_tech_purchase_model";

export interface IBlueTechPurchaseItem {
    id?: number;
    purchaseId?: number;
    itemId: number;
    quantity: number;
    unitPrice?: string | null;
    totalPrice?: string | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBlueTechPurchase {
    id?: number;
    purchaseNumber: string;
    supplierName?: string | null;
    imeiNumber?: string | null;
    qty?: string | null;
    purchasesPrice?: string | null;
    advancePayment?: string | null;
    duePayment?: string | null;
    paymentMethod?: string | null;
    notes?: string | null;
    username?: string;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt?: Date;
    updatedAt?: Date;

    items?: IBlueTechPurchaseItem[];
}

export interface IBlueTechPurchaseItemRepository {
    create(blueTechPurchaseItemsData: IBlueTechPurchaseItem): Promise<BlueTechPurchaseItemModel>;

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: IBlueTechPurchaseItem[]; total: number }>;

    edit(id: number): Promise<IBlueTechPurchaseItem | null>;
    update(id: number, updateData: Partial<IBlueTechPurchaseItem>): Promise<any>;
}

export interface IBlueTechPurchaseRepository {
    create(blueTechPurchaseData: IBlueTechPurchase): Promise<BlueTechPurchaseModel>;

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: IBlueTechPurchase[]; total: number }>;

    edit(id: number): Promise<IBlueTechPurchase | null>;
    update(id: number, updateData: Partial<IBlueTechPurchase>): Promise<any>;

    getDataByItemId(): Promise<{ id: string; label: string }[]>;
}