export interface IBlueTechCustomerAdvancePaymentMethod {
    id: number;
    customerName: string;
    advance_amount: string;
    settled_amount: string;
    remaining_amount: string;
    paymentMethod: string;
    notes: string;
    created_by?: string;
    created_at: Date;
}

export interface IBlueTechCustomerAdvancePaymentRepository {

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: IBlueTechCustomerAdvancePaymentMethod[]; total: number }>;
}