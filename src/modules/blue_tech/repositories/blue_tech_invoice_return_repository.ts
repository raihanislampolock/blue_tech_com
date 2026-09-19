import { AppDataSource } from "../../../init";
import { IBlueTechInvoiceReturn, IBlueTechInvoiceReturnRepository } from "../interfaces/blue_tech_invoice_return_interface";
import { BlueTechInvoiceReturnModel } from "../models/blue_tech_invoice_return_model";
import { BlueTechInvoiceReturnItemModel } from "../models/blue_tech_invoice_return_item_model";
import { BlueTechInvoiceModel } from "../models/blue_tech_invoice_modal";
import { BlueTechInvoiceItemModel } from "../models/blue_tech_invoice_item_modal";
import { BlueTechItemStockModel } from "../models/blue_tech_itemstock_model";
import { BlueTechStockMovementModel } from "../models/blue_tech_stock_movement_model";

export class BlueTechInvoiceReturnRepository implements IBlueTechInvoiceReturnRepository {
    private returnRepo = AppDataSource.getRepository(BlueTechInvoiceReturnModel);

    public async create(data: IBlueTechInvoiceReturn): Promise<any> {
        const qr = AppDataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
            if (!data.invoiceId) throw new Error("Invoice is required");
            if (!data.items?.length) throw new Error("At least one return item is required");

            const invoice = await qr.manager.findOne(BlueTechInvoiceModel, {
                where: { id: data.invoiceId }
            });

            if (!invoice) throw new Error("Invoice not found");
            if (String(invoice.invoiceStatus).toUpperCase() === "CANCELLED") {
                throw new Error("Cancelled invoices cannot be returned");
            }

            const subtotal = data.items.reduce((sum, item) => {
                const quantity = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                return sum + (Number(item.totalPrice) || quantity * unitPrice);
            }, 0);

            const savedReturn = await qr.manager.save(BlueTechInvoiceReturnModel, qr.manager.create(BlueTechInvoiceReturnModel, {
                returnNumber: data.returnNumber || await this.generateReturnNumber(),
                invoiceId: invoice.id,
                customerId: data.customerId ?? invoice.customerId ?? null,
                returnDate: data.returnDate || new Date(),
                returnStatus: data.returnStatus || "COMPLETED",
                reason: data.reason || null,
                subtotal,
                refundAmount: Number(data.refundAmount ?? subtotal),
                refundStatus: data.refundStatus || null,
                refundMethod: data.refundMethod || null,
                notes: data.notes || null,
                createdBy: data.createdBy || "system"
            } as any));

            for (const item of data.items) {
                const quantity = Number(item.quantity);
                const unitPrice = Number(item.unitPrice);

                if (!Number.isInteger(quantity) || quantity <= 0 || unitPrice < 0) {
                    throw new Error("Return item quantity and price are invalid");
                }

                const invoiceItemRows = await qr.manager.query(`
                    SELECT ii.id, ii."invoiceId", ii."itemId", ii.quantity, ii."unitPrice",
                           ii."totalPrice", ii."itemNameSnapshot", ii."imeiNumber"
                    FROM public.blue_tech_invoice_items ii
                    WHERE ii.id = $1 AND ii."invoiceId" = $2
                    FOR UPDATE
                `, [item.invoiceItemId, invoice.id]);

                const invoiceItem = invoiceItemRows[0];
                if (!invoiceItem) throw new Error(`Invoice item ${item.invoiceItemId} not found`);
                if (Number(invoiceItem.itemId) !== Number(item.itemId)) {
                    throw new Error(`Return item ${item.itemId} does not match invoice item ${item.invoiceItemId}`);
                }

                const alreadyReturned = await this.getReturnedQuantity(qr, item.invoiceItemId);
                const remainingQuantity = Number(invoiceItem.quantity) - alreadyReturned;
                if (quantity > remainingQuantity) {
                    throw new Error(`Return quantity exceeds remaining quantity for item ${item.itemId}`);
                }

                const stockAction = String(item.stockAction || "RESTOCK").toUpperCase();
                const totalPrice = Number(item.totalPrice) || quantity * unitPrice;

                await qr.manager.save(BlueTechInvoiceReturnItemModel, qr.manager.create(BlueTechInvoiceReturnItemModel, {
                    returnId: savedReturn.id,
                    invoiceItemId: item.invoiceItemId,
                    itemId: item.itemId,
                    quantity,
                    unitPrice,
                    totalPrice,
                    itemNameSnapshot: item.itemNameSnapshot || invoiceItem.itemNameSnapshot || null,
                    imeiNumber: item.imeiNumber || invoiceItem.imeiNumber || null,
                    returnReason: item.returnReason || null,
                    itemCondition: item.itemCondition || null,
                    stockAction,
                    notes: item.notes || null,
                    createdBy: data.createdBy || "system"
                } as any));

                if (stockAction === "RESTOCK") {
                    await this.applyStockChange(qr, item.itemId, quantity, data.createdBy || "system");
                }

                await qr.manager.save(BlueTechStockMovementModel, {
                    itemId: item.itemId,
                    quantity: stockAction === "RESTOCK" ? quantity : 0,
                    movementType: stockAction === "RESTOCK" ? "INVOICE_RETURN" : `INVOICE_RETURN_${stockAction}`,
                    referenceId: savedReturn.id,
                    note: "Invoice return created"
                });
            }

            await qr.commitTransaction();

            return {
                status: true,
                message: "Invoice return created successfully",
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
                OR inv."invoiceNumber" ILIKE $1
                OR c."customerName" ILIKE $1
                OR ri."itemNameSnapshot" ILIKE $1
                OR i."itemName" ILIKE $1
            `;
            params.push(`%${searchStr}%`);
        }

        const data = await AppDataSource.query(`
            SELECT
                r.id,
                r."returnNumber",
                r."invoiceId",
                inv."invoiceNumber",
                r."customerId",
                c."customerName",
                r."returnDate",
                r."returnStatus",
                r.reason,
                r.subtotal,
                r."refundAmount",
                r."refundStatus",
                r."refundMethod",
                r.notes,
                ri.id AS "returnItemId",
                ri."invoiceItemId",
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
                ri."stockAction",
                u."empId" AS "createdBy",
                u2."empId" AS "updatedBy",
                r."createdAt",
                r."updatedAt"
            FROM public.blue_tech_invoice_returns r
            LEFT JOIN public.blue_tech_invoices inv ON inv.id = r."invoiceId"
            LEFT JOIN public.blue_tech_customers c ON c.id = r."customerId"
            LEFT JOIN public.blue_tech_invoice_return_items ri ON ri."returnId" = r.id
            LEFT JOIN public.blue_tech_items i ON i.id = ri."itemId"
            LEFT JOIN public.users u ON r."createdBy" = u."userId"
            LEFT JOIN public.users u2 ON r."updatedBy" = u2."userId"
            ${whereSQL}
            ORDER BY r."createdAt" DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset]);

        const countResult = await AppDataSource.query(`
            SELECT COUNT(DISTINCT r.id) AS total
            FROM public.blue_tech_invoice_returns r
            LEFT JOIN public.blue_tech_invoices inv ON inv.id = r."invoiceId"
            LEFT JOIN public.blue_tech_customers c ON c.id = r."customerId"
            LEFT JOIN public.blue_tech_invoice_return_items ri ON ri."returnId" = r.id
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

    public async getInvoiceForReturn(invoiceNumber: string): Promise<any | null> {
        const rows = await AppDataSource.query(`
            SELECT
                inv.id,
                inv."invoiceNumber",
                inv."customerId",
                inv."invoiceDate",
                inv."invoiceStatus",
                inv."paymentStatus",
                inv.subtotal,
                inv."discountAmount",
                inv."totalAmount",
                inv."paidAmount",
                inv."dueAmount",
                inv."customerNameSnapshot",
                inv."customerPhoneSnapshot",
                inv."billingAddressSnapshot",
                c."customerName",
                c."phoneNumber",
                c.email
            FROM public.blue_tech_invoices inv
            LEFT JOIN public.blue_tech_customers c ON c.id = inv."customerId"
            WHERE inv."invoiceNumber" = $1
            LIMIT 1
        `, [invoiceNumber]);

        return rows[0] || null;
    }

    public async getInvoiceItemsForReturn(invoiceId: number): Promise<any[]> {
        return AppDataSource.query(`
            SELECT
                ii.id AS "invoiceItemId",
                ii."invoiceId",
                ii."itemId",
                COALESCE(ii."itemNameSnapshot", i."itemName") AS "itemName",
                i."itemType",
                i."itemConfigurations",
                ii."imeiNumber",
                ii.quantity AS "soldQuantity",
                COALESCE(ret."returnedQuantity", 0) AS "returnedQuantity",
                (ii.quantity - COALESCE(ret."returnedQuantity", 0)) AS "remainingQuantity",
                ii."unitPrice",
                ii."totalPrice",
                ii.notes
            FROM public.blue_tech_invoice_items ii
            LEFT JOIN public.blue_tech_items i ON i.id = ii."itemId"
            LEFT JOIN (
                SELECT ri."invoiceItemId", SUM(ri.quantity) AS "returnedQuantity"
                FROM public.blue_tech_invoice_return_items ri
                INNER JOIN public.blue_tech_invoice_returns r ON r.id = ri."returnId"
                WHERE r."returnStatus" <> 'CANCELLED'
                GROUP BY ri."invoiceItemId"
            ) ret ON ret."invoiceItemId" = ii.id
            WHERE ii."invoiceId" = $1
            ORDER BY ii.id ASC
        `, [invoiceId]);
    }

    public async generateReturnNumber(): Promise<string> {
        const rows = await AppDataSource.query(`
            SELECT CONCAT('RET/', TO_CHAR(NOW(), 'YYYYMM'), '/', LPAD(nextval('blue_tech_invoice_return_seq')::text, 3, '0')) AS "returnNumber"
        `);
        return rows[0].returnNumber;
    }

    public async cancel(id: number, updatedBy = "system"): Promise<any> {
        const qr = AppDataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
            const invoiceReturn = await qr.manager.findOne(BlueTechInvoiceReturnModel, { where: { id } });
            if (!invoiceReturn) throw new Error("Invoice return not found");
            if (String(invoiceReturn.returnStatus).toUpperCase() === "CANCELLED") {
                throw new Error("Invoice return is already cancelled");
            }

            const returnItems = await qr.manager.find(BlueTechInvoiceReturnItemModel, { where: { returnId: id } });
            for (const item of returnItems) {
                if (String(item.stockAction || "").toUpperCase() === "RESTOCK") {
                    await this.applyStockChange(qr, item.itemId, -Number(item.quantity), updatedBy);
                    await qr.manager.save(BlueTechStockMovementModel, {
                        itemId: item.itemId,
                        quantity: -Number(item.quantity),
                        movementType: "INVOICE_RETURN_CANCEL",
                        referenceId: id,
                        note: "Invoice return cancelled"
                    });
                }
            }

            await qr.manager.update(BlueTechInvoiceReturnModel, id, {
                returnStatus: "CANCELLED",
                updatedBy
            });

            await qr.commitTransaction();

            return {
                status: true,
                message: "Invoice return cancelled successfully"
            };
        } catch (error) {
            await qr.rollbackTransaction();
            throw error;
        } finally {
            await qr.release();
        }
    }

    private async getReturnedQuantity(qr: any, invoiceItemId: number): Promise<number> {
        const rows = await qr.manager.query(`
            SELECT COALESCE(SUM(ri.quantity), 0) AS quantity
            FROM public.blue_tech_invoice_return_items ri
            INNER JOIN public.blue_tech_invoice_returns r ON r.id = ri."returnId"
            WHERE ri."invoiceItemId" = $1
              AND r."returnStatus" <> 'CANCELLED'
        `, [invoiceItemId]);

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
        if (stock) {
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
        } else {
            if (quantity < 0) throw new Error(`Stock not found for item ${itemId}`);
            await qr.manager.save(BlueTechItemStockModel, qr.manager.create(BlueTechItemStockModel, {
                itemId,
                onHandQuantity: quantity,
                reservedQuantity: 0,
                availableQuantity: quantity,
                createdBy: userId || "system"
            }));
        }
    }

    private async getReturnRows(whereSQL: string, params: any[]): Promise<any[]> {
        return AppDataSource.query(`
            SELECT
                r.id,
                r."returnNumber",
                r."invoiceId",
                inv."invoiceNumber",
                r."customerId",
                c."customerName",
                r."returnDate",
                r."returnStatus",
                r.reason,
                r.subtotal,
                r."refundAmount",
                r."refundStatus",
                r."refundMethod",
                r.notes,
                r."createdBy",
                r."updatedBy",
                r."createdAt",
                r."updatedAt",
                ri.id AS "returnItemId",
                ri."invoiceItemId",
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
                ri."stockAction",
                ri.notes AS "itemNotes"
            FROM public.blue_tech_invoice_returns r
            LEFT JOIN public.blue_tech_invoices inv ON inv.id = r."invoiceId"
            LEFT JOIN public.blue_tech_customers c ON c.id = r."customerId"
            LEFT JOIN public.blue_tech_invoice_return_items ri ON ri."returnId" = r.id
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
            invoiceId: rows[0].invoiceId,
            invoiceNumber: rows[0].invoiceNumber,
            customerId: rows[0].customerId,
            customerName: rows[0].customerName,
            returnDate: rows[0].returnDate,
            returnStatus: rows[0].returnStatus,
            reason: rows[0].reason,
            subtotal: Number(rows[0].subtotal || 0),
            refundAmount: Number(rows[0].refundAmount || 0),
            refundStatus: rows[0].refundStatus,
            refundMethod: rows[0].refundMethod,
            notes: rows[0].notes,
            createdBy: rows[0].createdBy,
            updatedBy: rows[0].updatedBy,
            createdAt: rows[0].createdAt,
            updatedAt: rows[0].updatedAt,
            items: rows
                .filter(row => row.returnItemId)
                .map(row => ({
                    id: row.returnItemId,
                    invoiceItemId: row.invoiceItemId,
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
                    stockAction: row.stockAction,
                    notes: row.itemNotes
                }))
        };
    }
}
