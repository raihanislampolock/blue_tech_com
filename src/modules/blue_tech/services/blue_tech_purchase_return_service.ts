import { IBlueTechPurchaseReturn, IBlueTechPurchaseReturnRepository } from "../interfaces/blue_tech_purchase_return_interface";
import { BlueTechPurchaseReturnRepository } from "../repositories/blue_tech_purchase_return_repository";

export class BlueTechPurchaseReturnService {
    private repository: BlueTechPurchaseReturnRepository;

    constructor(repository: IBlueTechPurchaseReturnRepository) {
        this.repository = repository as BlueTechPurchaseReturnRepository;
    }

    public async create(data: Partial<IBlueTechPurchaseReturn>): Promise<any> {
        if (!data.returnNumber || !data.purchaseId || !data.items?.length) {
            throw new Error("Return number, purchase, and items are required");
        }

        return this.repository.create(data as IBlueTechPurchaseReturn);
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

    public getPurchaseForReturn(purchaseNumber: string): Promise<any | null> {
        return this.repository.getPurchaseForReturn(purchaseNumber);
    }

    public getPurchaseItemsForReturn(purchaseId: number): Promise<any[]> {
        return this.repository.getPurchaseItemsForReturn(purchaseId);
    }

    public generateReturnNumber(): Promise<string> {
        return this.repository.generateReturnNumber();
    }

    public cancel(id: number, updatedBy?: string): Promise<any> {
        return this.repository.cancel(id, updatedBy);
    }
}
