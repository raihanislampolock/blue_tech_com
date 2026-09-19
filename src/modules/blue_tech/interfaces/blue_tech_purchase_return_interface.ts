export interface IBlueTechPurchaseReturnItem {
    id?: number;

    returnId?: number;

    purchaseItemId: number;

    itemId: number;

    quantity: number;

    unitPrice: number;

    totalPrice: number;

    itemNameSnapshot?: string | null;

    imeiNumber: string;

    returnReason?: string | null;

    itemCondition?: string | null;

    notes?: string | null;

    createdBy?: string | null;

    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface IBlueTechPurchaseReturn {
    id?: number;

    returnNumber: string;

    purchaseId: number;

    supplierName?: string | null;

    returnDate?: Date | string;

    returnStatus?: string;

    reason?: string | null;

    subtotal?: number;

    creditAmount?: number;

    creditStatus?: string | null;

    creditMethod?: string | null;

    notes?: string | null;

    createdBy?: string | null;

    updatedBy?: string | null;

    createdAt?: Date | string;
    updatedAt?: Date | string;

    items: IBlueTechPurchaseReturnItem[];
}

export interface IBlueTechPurchaseReturnRepository {

    create(
        data: IBlueTechPurchaseReturn
    ): Promise<any>;

    getAll(
        search: string,
        page: number,
        limit: number
    ): Promise<{
        data: any[];
        total: number;
        totalPages: number;
        currentPage: number;
    }>;

    getById(
        id: number
    ): Promise<any | null>;

    getByReturnNumber(
        returnNumber: string
    ): Promise<any | null>;

    getPurchaseForReturn(
        purchaseNumber: string
    ): Promise<any | null>;

    getPurchaseItemsForReturn(
        purchaseId: number
    ): Promise<any[]>;

    generateReturnNumber(): Promise<string>;

    cancel(
        id: number,
        updatedBy?: string
    ): Promise<any>;
}
