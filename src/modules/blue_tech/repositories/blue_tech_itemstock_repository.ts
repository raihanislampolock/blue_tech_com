import { AppDataSource } from "../../../init";
import { IBlueTechItemStock, IBlueTechItemStockRepository } from "../interfaces/blue_tech_itemstock_interface";
import { BlueTechItemStockModel } from "../models/blue_tech_itemstock_model";

export class BlueTechItemStockRepository implements IBlueTechItemStockRepository {
    private itemStockModel = AppDataSource.getRepository(BlueTechItemStockModel);

    public async getAll(
        searchStr: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{ data: any[]; total: number; totalPages: number; currentPage: number }> {
        try {
            const offset = (page - 1) * limit;
            const whereClauses: string[] = [];
            const params: any[] = [];

            if (searchStr) {
                whereClauses.push(`
                    (
                        i."itemName" ILIKE $${params.length + 1} OR
                        i."itemType" ILIKE $${params.length + 1}
                    )
                `);
                params.push(`%${searchStr}%`);
            }

            if (whereClauses.length === 0) {
                whereClauses.push("1 = 1");
            }

            const whereSQL = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

            const query = `
                SELECT
                    s.id,
                    s."itemId",
                    i."itemName",
                    i."itemType",
                    s."onHandQuantity",
                    s."reservedQuantity",
                    s."availableQuantity",
                    s."lastPurchasePrice",
                    s."lastPurchaseDate",
                    s.notes,
                    s.created_at,
                    s.updated_at
                FROM public.blue_tech_item_stocks s
                LEFT JOIN public.blue_tech_items i ON s."itemId" = i.id
                ${whereSQL}
                ORDER BY s."created_at" DESC
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;

            const countQuery = `
                SELECT COUNT(s.id) AS total
                FROM public.blue_tech_item_stocks s
                LEFT JOIN public.blue_tech_items i ON s."itemId" = i.id
                ${whereSQL}
            `;

            const data = await AppDataSource.query(query, [...params, limit, offset]);
            const countResult = await AppDataSource.query(countQuery, params);

            const total = parseInt(countResult[0]?.total || "0", 10);
            const totalPages = Math.ceil(total / limit);

            return {
                data,
                total,
                totalPages,
                currentPage: page,
            };
        } catch (error) {
            console.error("Error fetching stock data:", error);
            throw new Error("Failed to fetch stock data");
        }
    }

    public async edit(id: number): Promise<IBlueTechItemStock | null> {
        try {
            const stock = await this.itemStockModel.findOne({
                where: { id },
                relations: ["item"],
            });
            return stock || null;
        } catch (error) {
            console.error("Error fetching stock for edit:", error);
            throw new Error("Failed to fetch stock");
        }
    }

    public async update(id: number, updateData: Partial<IBlueTechItemStock>): Promise<any> {
        try {
            const { item, ...stockData } = updateData;
            const result = await this.itemStockModel.update(id, stockData);
            return result;
        } catch (error) {
            console.error("Error updating stock by id:", error);
            throw new Error("Failed to update stock");
        }
    }

    public async getByItemId(itemId: number): Promise<IBlueTechItemStock | null> {
        try {
            const stock = await this.itemStockModel.findOne({
                where: { itemId },
                relations: ["item"],
            });
            return stock || null;
        } catch (error) {
            console.error("Error fetching stock by itemId:", error);
            throw new Error("Failed to fetch stock");
        }
    }

    public async create(data: Partial<IBlueTechItemStock>): Promise<BlueTechItemStockModel> {
        try {
            const stock = this.itemStockModel.create({
                itemId: data.itemId,
                onHandQuantity: data.onHandQuantity || 0,
                reservedQuantity: data.reservedQuantity || 0,
                availableQuantity: data.availableQuantity || 0,
                lastPurchasePrice: data.lastPurchasePrice,
                lastPurchaseDate: data.lastPurchaseDate,
                notes: data.notes,
                createdBy: data.createdBy,
            });
            return await this.itemStockModel.save(stock);
        } catch (error) {
            console.error("Error creating stock:", error);
            throw new Error("Failed to create stock");
        }
    }

    public async updateByItemId(itemId: number, updateData: Partial<IBlueTechItemStock>): Promise<any> {
        try {
            const query = `
                UPDATE public.blue_tech_item_stocks
                SET
                    "onHandQuantity" = $2,
                    "reservedQuantity" = $3,
                    "availableQuantity" = $4,
                    "lastPurchasePrice" = $5,
                    "lastPurchaseDate" = $6,
                    "notes" = $7,
                    "updatedBy" = $8,
                    updated_at = NOW()
                WHERE
                    "itemId" = $1
            `;

            const params = [
                itemId,
                updateData.onHandQuantity,
                updateData.reservedQuantity,
                updateData.availableQuantity,
                updateData.lastPurchasePrice,
                updateData.lastPurchaseDate,
                updateData.notes,
                updateData.updatedBy
            ];

            await AppDataSource.query(query, params);
            return { status: true, message: 'Stock updated successfully' };
        } catch (error) {
            console.error("Error updating stock:", error);
            throw new Error("Failed to update stock");
        }
    }
}
