export interface IBlueTechAdvancePaymentMethod {
    id: number;
    supplierName: string;
    advance_amount: string;
    settled_amount: string;
    remaining_amount: string;
    paymentMethod: string;
    notes: string;
    created_by?: string;
    created_at: Date;
}

export interface IBlueTechAdvancePaymentRepository {

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: IBlueTechAdvancePaymentMethod[]; total: number }>;
}