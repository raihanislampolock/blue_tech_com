import { IBlueTechInvoiceReturn, IBlueTechInvoiceReturnRepository } from "../interfaces/blue_tech_invoice_return_interface";
import { BlueTechInvoiceReturnRepository } from "../repositories/blue_tech_invoice_return_repository";

export class BlueTechInvoiceReturnService {
    private repository: BlueTechInvoiceReturnRepository;

    constructor(repository: IBlueTechInvoiceReturnRepository) {
        this.repository = repository as BlueTechInvoiceReturnRepository;
    }

    public async create(data: Partial<IBlueTechInvoiceReturn>): Promise<any> {
        if (!data.returnNumber || !data.invoiceId || !data.items?.length) {
            throw new Error("Return number, invoice, and items are required");
        }

        return this.repository.create(data as IBlueTechInvoiceReturn);
    }

    public getAll(search: string, page: number, limit: number): Promise<any> {
        return this.repository.getAll(search, page, limit);
    }

    public getById(id: number): Promise<any | null> {
        return this.repository.getById(id);
    }

    public getByReturnNumber(returnNumber: string): Promise<any | null> {
        return this.repository.getByReturnNumber(returnNumber);
    }

    public getInvoiceForReturn(invoiceNumber: string): Promise<any | null> {
        return this.repository.getInvoiceForReturn(invoiceNumber);
    }

    public getInvoiceItemsForReturn(invoiceId: number): Promise<any[]> {
        return this.repository.getInvoiceItemsForReturn(invoiceId);
    }

    public generateReturnNumber(): Promise<string> {
        return this.repository.generateReturnNumber();
    }

    public cancel(id: number, updatedBy?: string): Promise<any> {
        return this.repository.cancel(id, updatedBy);
    }
}
