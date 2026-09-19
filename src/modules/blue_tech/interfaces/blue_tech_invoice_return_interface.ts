export interface IBlueTechInvoiceReturnItem {
    id?: number;

    returnId?: number;

    invoiceItemId: number;

    itemId: number;

    quantity: number;

    unitPrice: number;

    totalPrice: number;

    itemNameSnapshot?: string | null;

    imeiNumber: string;

    returnReason?: string | null;

    itemCondition?: string | null;

    stockAction?: string;

    notes?: string | null;

    createdBy?: string | null;

    createdAt?: Date | string;
    updatedAt?: Date | string;
}

export interface IBlueTechInvoiceReturn {
    id?: number;

    returnNumber: string;

    invoiceId: number;

    customerId?: number | null;

    returnDate?: Date | string;

    returnStatus?: string;

    reason?: string | null;

    subtotal?: number;

    refundAmount?: number;

    refundStatus?: string | null;

    refundMethod?: string | null;

    notes?: string | null;

    createdBy?: string | null;

    updatedBy?: string | null;

    createdAt?: Date | string;
    updatedAt?: Date | string;

    items: IBlueTechInvoiceReturnItem[];
}

export interface IBlueTechInvoiceReturnRepository {

    create(
        data: IBlueTechInvoiceReturn
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

    getInvoiceForReturn(
        invoiceNumber: string
    ): Promise<any | null>;

    getInvoiceItemsForReturn(
        invoiceId: number
    ): Promise<any[]>;

    generateReturnNumber(): Promise<string>;

    cancel(
        id: number,
        updatedBy?: string
    ): Promise<any>;
}