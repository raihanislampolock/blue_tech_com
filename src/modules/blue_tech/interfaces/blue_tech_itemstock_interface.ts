import { BlueTechItemStockModel } from "../models/blue_tech_itemstock_model";

export interface IBlueTechItemStock {
    id?: number;
    itemId: number;
    onHandQuantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    lastPurchasePrice?: string | null;
    lastPurchaseDate?: Date | null;
    notes?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
    item?: {
        id: number;
        itemName?: string;
        itemPrice?: string;
    } | null;
}

export interface IBlueTechItemStockRepository {
    create(blueTechItemStockData: IBlueTechItemStock): Promise<BlueTechItemStockModel>;

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{
        data: IBlueTechItemStock[];
        total: number;
        totalPages: number;
        currentPage: number;
    }>;

    edit(id: number): Promise<IBlueTechItemStock | null>;
    update(id: number, updateData: Partial<IBlueTechItemStock>): Promise<any>;
    getByItemId(itemId: number): Promise<IBlueTechItemStock | null>;
    updateByItemId(itemId: number, updateData: Partial<IBlueTechItemStock>): Promise<any>;
}

export interface IBlueTechItemStockService {
    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{
        data: IBlueTechItemStock[];
        total: number;
        totalPages: number;
        currentPage: number;
    }>;
    edit(id: number): Promise<IBlueTechItemStock | null>;
    getByItemId(itemId: number): Promise<IBlueTechItemStock | null>;
    updateByItemId(itemId: number, updateData: Partial<IBlueTechItemStock>): Promise<any>;
    createOrUpdateStock(
        itemId: number,
        quantityDelta: number,
        unitPrice?: string,
        createdBy?: string | null
    ): Promise<any>;
    syncPurchaseStock(
        previousItems: IBlueTechItemStockPurchaseLine[],
        currentItems: IBlueTechItemStockPurchaseLine[],
        userId?: string | null
    ): Promise<void>;
}

export interface IBlueTechItemStockPurchaseLine {
    itemId: number;
    quantity: number;
    unitPrice?: string;
}
