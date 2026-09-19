import { AppDataSource } from "../../../init";
import { IBlueTechPurchaseReturn, IBlueTechPurchaseReturnRepository } from "../interfaces/blue_tech_purchase_return_interface";
import { BlueTechItemStockModel } from "../models/blue_tech_itemstock_model";
import { BlueTechPurchaseModel } from "../models/blue_tech_purchase_model";
import { BlueTechPurchaseReturnItemModel } from "../models/blue_tech_purchase_return_item_model";
import { BlueTechPurchaseReturnModel } from "../models/blue_tech_purchase_return_model";
import { BlueTechStockMovementModel } from "../models/blue_tech_stock_movement_model";

export class BlueTechPurchaseReturnRepository implements IBlueTechPurchaseReturnRepository {
    public async create(data: IBlueTechPurchaseReturn): Promise<any> {
        const qr = AppDataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
            if (!data.purchaseId) throw new Error("Purchase is required");
            if (!data.items?.length) throw new Error("At least one return item is required");

            const purchase = await qr.manager.findOne(BlueTechPurchaseModel, { where: { id: data.purchaseId } });
            if (!purchase) throw new Error("Purchase not found");

            const subtotal = data.items.reduce((sum, item) => {
                const quantity = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                return sum + (Number(item.totalPrice) || quantity * unitPrice);
            }, 0);

            const savedReturn = await qr.manager.save(BlueTechPurchaseReturnModel, qr.manager.create(BlueTechPurchaseReturnModel, {
                returnNumber: data.returnNumber || await this.generateReturnNumber(),
                purchaseId: purchase.id,
                supplierName: data.supplierName || purchase.supplierName || null,
                returnDate: data.returnDate || new Date(),
                returnStatus: data.returnStatus || "COMPLETED",
                reason: data.reason || null,
                subtotal,
                creditAmount: Number(data.creditAmount ?? subtotal),
                creditStatus: data.creditStatus || null,
                creditMethod: data.creditMethod || null,
                notes: data.notes || null,
                createdBy: data.createdBy || "system"
            } as any));

            for (const item of data.items) {
                const quantity = Number(item.quantity);
                const unitPrice = Number(item.unitPrice);

                if (!Number.isInteger(quantity) || quantity <= 0 || unitPrice < 0) {
                    throw new Error("Return item quantity and price are invalid");
                }

                const purchaseItemRows = await qr.manager.query(`
                    SELECT pi.id, pi."purchaseId", pi."itemId", pi.quantity, pi."unitPrice",
                           pi."totalPrice", pi."imeiNumber", i."itemName"
                    FROM public.blue_tech_purchase_items pi
                    LEFT JOIN public.blue_tech_items i ON i.id = pi."itemId"
                    WHERE pi.id = $1 AND pi."purchaseId" = $2
                    FOR UPDATE OF pi
                `, [item.purchaseItemId, purchase.id]);

                const purchaseItem = purchaseItemRows[0];
                if (!purchaseItem) throw new Error(`Purchase item ${item.purchaseItemId} not found`);
                if (Number(purchaseItem.itemId) !== Number(item.itemId)) {
                    throw new Error(`Return item ${item.itemId} does not match purchase item ${item.purchaseItemId}`);
                }

                const alreadyReturned = await this.getReturnedQuantity(qr, item.purchaseItemId);
                const remainingQuantity = Number(purchaseItem.quantity) - alreadyReturned;
                if (quantity > remainingQuantity) {
                    throw new Error(`Return quantity exceeds remaining purchase quantity for item ${item.itemId}`);
                }

                const totalPrice = Number(item.totalPrice) || quantity * unitPrice;

                await qr.manager.save(BlueTechPurchaseReturnItemModel, qr.manager.create(BlueTechPurchaseReturnItemModel, {
                    returnId: savedReturn.id,
                    purchaseItemId: item.purchaseItemId,
                    itemId: item.itemId,
                    quantity,
                    unitPrice,
                    totalPrice,
                    itemNameSnapshot: item.itemNameSnapshot || purchaseItem.itemName || null,
                    imeiNumber: item.imeiNumber || purchaseItem.imeiNumber || null,
                    returnReason: item.returnReason || null,
                    itemCondition: item.itemCondition || null,
                    notes: item.notes || null,
                    createdBy: data.createdBy || "system"
                } as any));

                await this.applyStockChange(qr, item.itemId, -quantity, data.createdBy || "system");
                await qr.manager.save(BlueTechStockMovementModel, {
                    itemId: item.itemId,
                    quantity: -quantity,
                    movementType: "PURCHASE_RETURN",
                    referenceId: savedReturn.id,
                    note: "Purchase return created"
                });
            }

            await qr.commitTransaction();

            return {
                status: true,
                message: "Purchase return created successfully",
                data: savedReturn
            };
        } catch (error) {
            await qr.rollbackTransaction();
            throw error;
        } finally {
            await qr.release();
        }
    }

    public async getAll(searchStr = "", page = 1, limit = 10): Promise<{ data: any[]; total: number; totalPages: number; currentPage: number; }> {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        let whereSQL = "";

        if (searchStr) {
            whereSQL = `
                WHERE r."returnNumber" ILIKE $1
                OR p."purchaseNumber" ILIKE $1
                OR r."supplierName" ILIKE $1
                OR ri."itemNameSnapshot" ILIKE $1
                OR i."itemName" ILIKE $1
            `;
            params.push(`%${searchStr}%`);
        }

        const data = await AppDataSource.query(`
            SELECT
                r.id,
                r."returnNumber",
                r."purchaseId",
                p."purchaseNumber",
                r."supplierName",
                r."returnDate",
                r."returnStatus",
                r.reason,
                r.subtotal,
                r."creditAmount",
                r."creditStatus",
                r."creditMethod",
                r.notes,
                ri.id AS "returnItemId",
                ri."purchaseItemId",
                ri."itemId",
                COALESCE(ri."itemNameSnapshot", i."itemName") AS "itemName",
                i."itemType",
                i."itemConfigurations",
                ri.quantity,
                ri."unitPrice",
                ri."totalPrice",
                ri."imeiNumber",
                ri."returnReason",
                ri."itemCondition",
                u."empId" AS "createdBy",
                u2."empId" AS "updatedBy",
                r."createdAt",
                r."updatedAt"
            FROM public.blue_tech_purchase_returns r
            LEFT JOIN public.blue_tech_purchases p ON p.id = r."purchaseId"
            LEFT JOIN public.blue_tech_purchase_return_items ri ON ri."returnId" = r.id
            LEFT JOIN public.blue_tech_items i ON i.id = ri."itemId"
            LEFT JOIN public.users u ON r."createdBy" = u."userId"
            LEFT JOIN public.users u2 ON r."updatedBy" = u2."userId"
            ${whereSQL}
            ORDER BY r."createdAt" DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset]);

        const countResult = await AppDataSource.query(`
            SELECT COUNT(DISTINCT r.id) AS total
            FROM public.blue_tech_purchase_returns r
            LEFT JOIN public.blue_tech_purchases p ON p.id = r."purchaseId"
            LEFT JOIN public.blue_tech_purchase_return_items ri ON ri."returnId" = r.id
            LEFT JOIN public.blue_tech_items i ON i.id = ri."itemId"
            ${whereSQL}
        `, params);

        const total = Number(countResult[0]?.total || 0);
        return {
            data,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }

    public async getById(id: number): Promise<any | null> {
        const rows = await this.getReturnRows(`r.id = $1`, [id]);
        return this.groupReturn(rows);
    }

    public async getByReturnNumber(returnNumber: string): Promise<any | null> {
        const rows = await this.getReturnRows(`r."returnNumber" = $1`, [returnNumber]);
        return this.groupReturn(rows);
    }

    public async getPurchaseForReturn(purchaseNumber: string): Promise<any | null> {
        const rows = await AppDataSource.query(`
            SELECT
                p.id,
                p."purchaseNumber",
                p."supplierName",
                p.qty,
                p."purchasesPrice",
                p."advancePayment",
                p."settledPayment",
                p."duePayment",
                p."paymentMethod",
                p.notes,
                p."created_at" AS "createdAt"
            FROM public.blue_tech_purchases p
            WHERE p."purchaseNumber" = $1
            LIMIT 1
        `, [purchaseNumber]);

        return rows[0] || null;
    }

    public async getPurchaseItemsForReturn(purchaseId: number): Promise<any[]> {
        return AppDataSource.query(`
            SELECT
                pi.id AS "purchaseItemId",
                pi."purchaseId",
                pi."itemId",
                COALESCE(i."itemName", 'Item') AS "itemName",
                i."itemType",
                i."itemConfigurations",
                pi."imeiNumber",
                pi.quantity AS "purchasedQuantity",
                COALESCE(ret."returnedQuantity", 0) AS "returnedQuantity",
                (pi.quantity - COALESCE(ret."returnedQuantity", 0)) AS "remainingQuantity",
                pi."unitPrice",
                pi."totalPrice",
                pi.notes
            FROM public.blue_tech_purchase_items pi
            LEFT JOIN public.blue_tech_items i ON i.id = pi."itemId"
            LEFT JOIN (
                SELECT ri."purchaseItemId", SUM(ri.quantity) AS "returnedQuantity"
                FROM public.blue_tech_purchase_return_items ri
                INNER JOIN public.blue_tech_purchase_returns r ON r.id = ri."returnId"
                WHERE r."returnStatus" <> 'CANCELLED'
                GROUP BY ri."purchaseItemId"
            ) ret ON ret."purchaseItemId" = pi.id
            WHERE pi."purchaseId" = $1
            ORDER BY pi.id ASC
        `, [purchaseId]);
    }

    public async generateReturnNumber(): Promise<string> {
        const rows = await AppDataSource.query(`
            SELECT CONCAT('PRT/', TO_CHAR(NOW(), 'YYYYMM'), '/', LPAD(nextval('blue_tech_purchase_return_seq')::text, 3, '0')) AS "returnNumber"
        `);
        return rows[0].returnNumber;
    }

    public async cancel(id: number, updatedBy = "system"): Promise<any> {
        const qr = AppDataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
            const purchaseReturn = await qr.manager.findOne(BlueTechPurchaseReturnModel, { where: { id } });
            if (!purchaseReturn) throw new Error("Purchase return not found");
            if (String(purchaseReturn.returnStatus).toUpperCase() === "CANCELLED") {
                throw new Error("Purchase return is already cancelled");
            }

            const returnItems = await qr.manager.find(BlueTechPurchaseReturnItemModel, { where: { returnId: id } });
            for (const item of returnItems) {
                await this.applyStockChange(qr, item.itemId, Number(item.quantity), updatedBy);
                await qr.manager.save(BlueTechStockMovementModel, {
                    itemId: item.itemId,
                    quantity: Number(item.quantity),
                    movementType: "PURCHASE_RETURN_CANCEL",
                    referenceId: id,
                    note: "Purchase return cancelled"
                });
            }

            await qr.manager.update(BlueTechPurchaseReturnModel, id, {
                returnStatus: "CANCELLED",
                updatedBy
            });

            await qr.commitTransaction();

            return {
                status: true,
                message: "Purchase return cancelled successfully"
            };
        } catch (error) {
            await qr.rollbackTransaction();
            throw error;
        } finally {
            await qr.release();
        }
    }

    private async getReturnedQuantity(qr: any, purchaseItemId: number): Promise<number> {
        const rows = await qr.manager.query(`
            SELECT COALESCE(SUM(ri.quantity), 0) AS quantity
            FROM public.blue_tech_purchase_return_items ri
            INNER JOIN public.blue_tech_purchase_returns r ON r.id = ri."returnId"
            WHERE ri."purchaseItemId" = $1
              AND r."returnStatus" <> 'CANCELLED'
        `, [purchaseItemId]);

        return Number(rows[0]?.quantity || 0);
    }

    private async applyStockChange(qr: any, itemId: number, quantity: number, userId?: string): Promise<void> {
        const stockRows = await qr.manager.query(`
            SELECT id, "onHandQuantity", "availableQuantity"
            FROM public.blue_tech_item_stocks
            WHERE "itemId" = $1
            FOR UPDATE
        `, [itemId]);

        const stock = stockRows[0];
        if (!stock) {
            if (quantity < 0) throw new Error(`Stock not found for item ${itemId}`);
            await qr.manager.save(BlueTechItemStockModel, qr.manager.create(BlueTechItemStockModel, {
                itemId,
                onHandQuantity: quantity,
                reservedQuantity: 0,
                availableQuantity: quantity,
                createdBy: userId || "system"
            }));
            return;
        }

        const onHandQuantity = Number(stock.onHandQuantity || 0) + quantity;
        const availableQuantity = Number(stock.availableQuantity || 0) + quantity;

        if (onHandQuantity < 0 || availableQuantity < 0) {
            throw new Error(`Stock cannot be negative for item ${itemId}`);
        }

        await qr.manager.update(BlueTechItemStockModel, stock.id, {
            onHandQuantity,
            availableQuantity,
            updatedBy: userId || "system"
        });
    }

    private async getReturnRows(whereSQL: string, params: any[]): Promise<any[]> {
        return AppDataSource.query(`
            SELECT
                r.id,
                r."returnNumber",
                r."purchaseId",
                p."purchaseNumber",
                r."supplierName",
                r."returnDate",
                r."returnStatus",
                r.reason,
                r.subtotal,
                r."creditAmount",
                r."creditStatus",
                r."creditMethod",
                r.notes,
                r."createdBy",
                r."updatedBy",
                r."createdAt",
                r."updatedAt",
                ri.id AS "returnItemId",
                ri."purchaseItemId",
                ri."itemId",
                COALESCE(ri."itemNameSnapshot", i."itemName") AS "itemName",
                i."itemType",
                i."itemConfigurations",
                ri.quantity,
                ri."unitPrice",
                ri."totalPrice",
                ri."itemNameSnapshot",
                ri."imeiNumber",
                ri."returnReason",
                ri."itemCondition",
                ri.notes AS "itemNotes"
            FROM public.blue_tech_purchase_returns r
            LEFT JOIN public.blue_tech_purchases p ON p.id = r."purchaseId"
            LEFT JOIN public.blue_tech_purchase_return_items ri ON ri."returnId" = r.id
            LEFT JOIN public.blue_tech_items i ON i.id = ri."itemId"
            WHERE ${whereSQL}
            ORDER BY ri.id ASC
        `, params);
    }

    private groupReturn(rows: any[]): any | null {
        if (!rows.length) return null;

        return {
            id: rows[0].id,
            returnNumber: rows[0].returnNumber,
            purchaseId: rows[0].purchaseId,
            purchaseNumber: rows[0].purchaseNumber,
            supplierName: rows[0].supplierName,
            returnDate: rows[0].returnDate,
            returnStatus: rows[0].returnStatus,
            reason: rows[0].reason,
            subtotal: Number(rows[0].subtotal || 0),
            creditAmount: Number(rows[0].creditAmount || 0),
            creditStatus: rows[0].creditStatus,
            creditMethod: rows[0].creditMethod,
            notes: rows[0].notes,
            createdBy: rows[0].createdBy,
            updatedBy: rows[0].updatedBy,
            createdAt: rows[0].createdAt,
            updatedAt: rows[0].updatedAt,
            items: rows
                .filter(row => row.returnItemId)
                .map(row => ({
                    id: row.returnItemId,
                    purchaseItemId: row.purchaseItemId,
                    itemId: row.itemId,
                    itemName: row.itemName,
                    itemType: row.itemType,
                    itemConfigurations: row.itemConfigurations,
                    quantity: Number(row.quantity || 0),
                    unitPrice: Number(row.unitPrice || 0),
                    totalPrice: Number(row.totalPrice || 0),
                    itemNameSnapshot: row.itemNameSnapshot,
                    imeiNumber: row.imeiNumber,
                    returnReason: row.returnReason,
                    itemCondition: row.itemCondition,
                    notes: row.itemNotes
                }))
        };
    }
}
