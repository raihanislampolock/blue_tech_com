import { BlueTechPurchaseOrderItemModel } from "../models/blue_tech_purchase_order_item_model";
import { BlueTechPurchaseOrderModel } from "../models/blue_tech_purchase_order_model";

export interface IBlueTechPurchaseOrderItem {
    id?: number;
    purchaseOrderId?: number;
    itemId: number;
    quantity: number;
    imeiNumber?: string | null;
    unitPrice?: string | null;
    totalPrice?: string | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IBlueTechPurchaseOrder {
    id?: number;
    purchaseOrderNumber: string;
    supplierName?: string | null;
    imeiNumber?: string | null;
    qty?: string | null;
    purchasesOrderPrice?: string | null;
    advancePayment?: string | null;
    settledPayment?: string | null;
    duePayment?: string | null;
    paymentMethod?: string | null;
    notes?: string | null;
    username?: string;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt?: Date;
    updatedAt?: Date;

    items?: IBlueTechPurchaseOrderItem[];
}

export interface IBlueTechPurchaseOrderItemRepository {
    create(blueTechPurchaseItemsData: IBlueTechPurchaseOrderItem): Promise<BlueTechPurchaseOrderItemModel>;

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: IBlueTechPurchaseOrderItem[]; total: number }>;

    edit(id: number): Promise<IBlueTechPurchaseOrderItem | null>;
    update(id: number, updateData: Partial<IBlueTechPurchaseOrderItem>): Promise<any>;
}

export interface IBlueTechPurchaseOrderRepository {
    create(blueTechPurchaseData: IBlueTechPurchaseOrder): Promise<BlueTechPurchaseOrderModel>;

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: IBlueTechPurchaseOrder[]; total: number }>;

    edit(id: number): Promise<IBlueTechPurchaseOrder | null>;
    update(id: number, updateData: Partial<IBlueTechPurchaseOrder>): Promise<any>;

    getDataByItemId(): Promise<{ id: string; label: string; imeiNumber?: string | null }[]>;
    getDataBySupplierId(): Promise<{ id: string; label: string }[]>;
    getDataByPaymentMethodId(): Promise<{ id: string; label: string }[]>;
    recordSupplierAdvance(data: any): Promise<any>;
    getSupplierAdvanceBalance(supplierName: string): Promise<any>;
}