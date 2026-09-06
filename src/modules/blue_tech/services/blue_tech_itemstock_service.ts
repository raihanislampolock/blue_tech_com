import { Config } from "../../../core/Config";
import fs from "fs";
import { IBlueTechItemStock, IBlueTechItemStockRepository, IBlueTechItemStockService, IBlueTechItemStockPurchaseLine } from "../interfaces/blue_tech_itemstock_interface";

const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class BlueTechItemStockService implements IBlueTechItemStockService {
    private blueTechItemStockRepository: IBlueTechItemStockRepository;

    constructor(blueTechItemStockRepository: IBlueTechItemStockRepository) {
        this.blueTechItemStockRepository = blueTechItemStockRepository;
    }

    public async getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{
        data: IBlueTechItemStock[];
        total: number;
        totalPages: number;
        currentPage: number;
    }> {
        try {
            return await this.blueTechItemStockRepository.getAll(searchStr, page, limit);
        } catch (error) {
            console.error("Error fetching stock list:", error);
            throw new Error("Failed to fetch stock data");
        }
    }

    public async edit(id: number): Promise<IBlueTechItemStock | null> {
        try {
            const record = await this.blueTechItemStockRepository.edit(id);
            if (!record) {
                return null;
            }
            return record;
        } catch (error) {
            console.error("Error fetching stock:", error);
            throw new Error("Failed to fetch stock");
        }
    }

    public async getByItemId(itemId: number): Promise<IBlueTechItemStock | null> {
        try {
            return await this.blueTechItemStockRepository.getByItemId(itemId);
        } catch (error) {
            console.error("Error fetching stock by itemId:", error);
            throw new Error("Failed to fetch stock");
        }
    }

    public async updateByItemId(
        itemId: number,
        updateData: Partial<IBlueTechItemStock>
    ): Promise<any> {
        try {
            return await this.blueTechItemStockRepository.updateByItemId(itemId, updateData);
        } catch (error) {
            console.error("Error updating stock:", error);
            throw new Error("Failed to update stock");
        }
    }

    public async createOrUpdateStock(
        itemId: number,
        quantityDelta: number,
        unitPrice?: string,
        createdBy?: string | null
    ): Promise<any> {
        try {
            const existingStock = await this.blueTechItemStockRepository.getByItemId(itemId);

            if (existingStock) {
                const currentOnHand = existingStock.onHandQuantity ?? 0;
                const reserved = existingStock.reservedQuantity ?? 0;

                const newOnHand = currentOnHand + quantityDelta;

                // 🚨 DO NOT ALLOW NEGATIVE
                if (newOnHand < 0) {
                    throw new Error(`Stock cannot go negative for itemId ${itemId}`);
                }

                const newAvailable = newOnHand - reserved;

                return await this.blueTechItemStockRepository.updateByItemId(itemId, {
                    onHandQuantity: newOnHand,
                    reservedQuantity: reserved, // ✅ FIX (VERY IMPORTANT)
                    availableQuantity: newAvailable,
                    lastPurchasePrice: unitPrice ?? existingStock.lastPurchasePrice ?? null,
                    lastPurchaseDate: quantityDelta > 0 ? new Date() : existingStock.lastPurchaseDate ?? null,
                    updatedBy: createdBy ?? null
                });

            } else {
                // NEW STOCK
                if (quantityDelta < 0) {
                    throw new Error(`Cannot create negative stock for itemId ${itemId}`);
                }

                const onHand = quantityDelta;
                const reserved = 0;
                const available = onHand - reserved;

                return await this.blueTechItemStockRepository.create({
                    itemId,
                    onHandQuantity: onHand,
                    reservedQuantity: reserved, // ✅ FIX
                    availableQuantity: available,
                    lastPurchasePrice: unitPrice ?? null,
                    lastPurchaseDate: quantityDelta > 0 ? new Date() : null,
                    createdBy: createdBy ?? null
                });
            }

        } catch (error) {
            console.error("Error in createOrUpdateStock:", error);
            throw error;
        }
    }

    public async syncPurchaseStock(
        previousItems: IBlueTechItemStockPurchaseLine[],
        currentItems: IBlueTechItemStockPurchaseLine[],
        userId?: string | null
    ): Promise<void> {
        try {
            if (previousItems && previousItems.length > 0) {
                for (const item of previousItems) {
                    await this.createOrUpdateStock(item.itemId, -item.quantity, undefined, userId);
                }
            }

            if (currentItems && currentItems.length > 0) {
                for (const item of currentItems) {
                    await this.createOrUpdateStock(item.itemId, item.quantity, item.unitPrice, userId);
                }
            }
        } catch (error) {
            console.error("Error syncing purchase stock:", error);
            throw error;
        }
    }
}
