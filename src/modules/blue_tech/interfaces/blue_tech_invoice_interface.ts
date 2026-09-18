import { BlueTechInvoiceModel } from "../models/blue_tech_invoice_modal";

export interface IBlueTechInvoiceItem {
    id?: number;
    itemId: number;
    itemName?: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    itemDiscountAmount?: number;
    taxAmount?: number;
    purchaseItemId?: number;
    imeiNumber?: string | null;
    notes?: string | null;
}

export interface IBlueTechInvoice {
    id?: number;
    invoiceNumber: string;
    customerId: number;
    customerNameSnapshot?: string;
    customerPhoneSnapshot?: string;
    billingAddressSnapshot?: string;
    invoiceDate?: Date | string;
    dueDate?: Date | string;
    invoiceStatus?: string;
    paymentStatus?: string;
    paymentMethodId?: number;
    subtotal?: number;
    discountAmount?: number;
    taxAmount?: number;
    totalAmount?: number;
    paidAmount?: number;
    advanceAmountApplied?: number;
    dueAmount?: number;
    notes?: string | null;
    createdBy?: string;
    updatedBy?: string;
    username?: string;
    items: IBlueTechInvoiceItem[];
}

export interface IBlueTechInvoiceRepository {
    create(data: IBlueTechInvoice): Promise<BlueTechInvoiceModel>;
    getAll(search: string, page: number, limit: number): Promise<{ data: any[]; total: number; totalPages: number; currentPage: number }>;
    edit(id: number): Promise<any | null>;
    update(id: number, data: IBlueTechInvoice): Promise<any>;
    generateInvoiceNumber(customerCode?: string): Promise<string>;
    recordCustomerAdvance(data: any): Promise<any>;
    getCustomerAdvanceBalance(customerId: number): Promise<any>;
    getItemDropdown(): Promise<any[]>;
    getCustomerDropdown(): Promise<any[]>;
    getPaymentMethodDropdown(): Promise<any[]>;
}
