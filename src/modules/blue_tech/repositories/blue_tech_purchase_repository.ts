import { AppDataSource } from "../../../init";
import { IBlueTechPurchase, IBlueTechPurchaseItem, IBlueTechPurchaseRepository, IBlueTechPurchaseItemRepository } from "../interfaces/blue_tech_purchase_interface";
import { BlueTechPurchaseModel } from "../models/blue_tech_purchase_model";
import { BlueTechPurchaseItemModel } from "../models/blue_tech_purchase_item_model";
import { BlueTechStockMovementModel } from "../models/blue_tech_stock_movement_model";
import { BlueTechItemsModel } from "../models/blue_tech_item_model";
import { BlueTechItemStockModel } from "../models/blue_tech_itemstock_model";
import { BlueTechSupplierPaymentModel } from "../models/blue_tech_supplier_payment_model";
import { BlueTechSupplierPaymentAllocationModel } from "../models/blue_tech_supplier_payment_allocation_model";

export class BlueTechPurchaseRepository implements IBlueTechPurchaseRepository {

    private purchaseRepo = AppDataSource.getRepository(BlueTechPurchaseModel);
    private purchaseitemRepo = AppDataSource.getRepository(BlueTechPurchaseItemModel);

    // ✅ CREATE (Parent + Items)
    public async create(data: any): Promise<any> {

        const qr = AppDataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
            const totalPrice = Number(data.purchasesPrice) || 0;
            const advanceApplied = Math.max(0, Number(data.advancePayment) || 0);
            const settledPayment = Math.max(advanceApplied, Number(data.settledPayment) || 0);
            const duePayment = Math.max(0, totalPrice - settledPayment);

            if (settledPayment > totalPrice) {
                throw new Error("Settled payment cannot exceed the purchase price");
            }

            // 👉 1. Save Purchase
            const purchase = qr.manager.create(BlueTechPurchaseModel, {
                purchaseNumber: data.purchaseNumber,
                supplierName: data.supplierName,
                imeiNumber: data.imeiNumber,
                qty: data.qty,
                purchasesPrice: data.purchasesPrice,
                advancePayment: advanceApplied.toFixed(2),
                settledPayment: settledPayment.toFixed(2),
                duePayment: duePayment.toFixed(2),
                paymentMethod: data.paymentMethod,
                notes: data.notes,
                createdBy: data.createdBy
            });

            const savedPurchase = await qr.manager.save(purchase);

            if (advanceApplied > 0) {
                await this.allocateSupplierAdvance(
                    qr,
                    savedPurchase.id,
                    data.supplierName,
                    advanceApplied,
                    data.createdBy
                );
            }

            // 👉 2. Process Items
            for (const item of data.items) {

                // 👉 Save purchase item
                const purchaseItem = qr.manager.create(BlueTechPurchaseItemModel, {
                    purchaseId: savedPurchase.id,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    imeiNumber: item.imeiNumber || null,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    notes: item.description || '',
                    createdBy: data.createdBy
                });

                await qr.manager.save(purchaseItem);

                // 👉 Update Item Price
                await qr.manager.update(BlueTechItemsModel, item.itemId, {
                    itemPrice: item.unitPrice
                });

                // 👉 Update Stock
                const stockRepo = qr.manager.getRepository(BlueTechItemStockModel);
                let stock = await stockRepo.findOne({ where: { itemId: item.itemId } });

                if (stock) {
                    stock.onHandQuantity += item.quantity;
                    stock.availableQuantity += item.quantity;
                    stock.lastPurchasePrice = item.unitPrice;
                    stock.lastPurchaseDate = new Date();
                } else {
                    stock = stockRepo.create({
                        itemId: item.itemId,
                        onHandQuantity: item.quantity,
                        reservedQuantity: 0,
                        availableQuantity: item.quantity,
                        lastPurchasePrice: item.unitPrice,
                        lastPurchaseDate: new Date(),
                        createdBy: data.createdBy
                    });
                }

                await stockRepo.save(stock);

                // 👉 Stock Movement
                await qr.manager.save(BlueTechStockMovementModel, {
                    itemId: item.itemId,
                    quantity: item.quantity,
                    movementType: "PURCHASE",
                    referenceId: savedPurchase.id,
                    note: "Purchase Created"
                });
            }

            await qr.commitTransaction();

            return {
                status: true,
                message: "Purchase created successfully",
                data: savedPurchase
            };

        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }

    public async recordSupplierAdvance(data: any): Promise<any> {
        const amount = Number(data.amount) || 0;
        const supplierName = String(data.supplierName || "").trim();

        if (!supplierName || amount <= 0) {
            throw new Error("Supplier name and a positive advance amount are required");
        }

        return this.purchaseRepo.manager.save(BlueTechSupplierPaymentModel, {
            supplierName,
            amount: amount.toFixed(2),
            allocatedAmount: "0.00",
            paymentMethod: data.paymentMethod || null,
            notes: data.notes || null,
            createdBy: data.createdBy || "system"
        });
    }

    public async getSupplierAdvanceBalance(supplierName: string): Promise<any> {
        const result = await AppDataSource.query(`
            SELECT
                COALESCE(SUM(amount), 0) AS "totalAdvance",
                COALESCE(SUM("allocatedAmount"), 0) AS "allocatedAdvance",
                COALESCE(SUM(amount - "allocatedAmount"), 0) AS "availableAdvance"
            FROM public.blue_tech_supplier_payments
            WHERE LOWER(TRIM("supplierName")) = LOWER(TRIM($1))
        `, [supplierName]);

        return {
            totalAdvance: Number(result[0]?.totalAdvance || 0),
            allocatedAdvance: Number(result[0]?.allocatedAdvance || 0),
            availableAdvance: Number(result[0]?.availableAdvance || 0)
        };
    }

    private async allocateSupplierAdvance(
        qr: any,
        purchaseId: number,
        supplierName: string,
        amount: number,
        createdBy: string
    ): Promise<void> {
        if (!supplierName) {
            throw new Error("A supplier is required when applying supplier advance");
        }

        const payments = await qr.manager.query(`
            SELECT id, amount, "allocatedAmount"
            FROM public.blue_tech_supplier_payments
            WHERE LOWER(TRIM("supplierName")) = LOWER(TRIM($1))
              AND amount > "allocatedAmount"
            ORDER BY created_at ASC, id ASC
            FOR UPDATE
        `, [supplierName]);

        let remaining = amount;
        for (const payment of payments) {
            if (remaining <= 0) break;

            const available = Number(payment.amount) - Number(payment.allocatedAmount);
            const allocation = Math.min(remaining, available);

            await qr.manager.query(`
                UPDATE public.blue_tech_supplier_payments
                SET "allocatedAmount" = "allocatedAmount" + $1
                WHERE id = $2
            `, [allocation.toFixed(2), payment.id]);

            await qr.manager.save(BlueTechSupplierPaymentAllocationModel, {
                supplierPaymentId: payment.id,
                purchaseId,
                amount: allocation.toFixed(2),
                createdBy: createdBy || "system"
            });

            remaining -= allocation;
        }

        if (remaining > 0.005) {
            throw new Error(`Supplier advance balance is insufficient by ${remaining.toFixed(2)}`);
        }
    }


    // ✅ GET ALL
    public async getAll(searchStr: string, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        let whereSQL = "";

        if (searchStr) {
            whereSQL = `
                WHERE p."purchaseNumber" ILIKE $1
                OR p."supplierName" ILIKE $1
                OR i."itemName" ILIKE $1
            `;
            params.push(`%${searchStr}%`);
        }

        const query = `
            SELECT
                p.id,
                p."purchaseNumber",
                p."supplierName",
                p."imeiNumber",
                p."qty",
                p."purchasesPrice",
                p."advancePayment",
                COALESCE(p."settledPayment", '0') AS "settledPayment",
                p."duePayment",
                p."paymentMethod",
                p.notes,
                i.id AS "itemId",
                i."itemName",
                i."itemType",
                i."itemConfigurations",
                i."manufactureOrigin",
                pi.quantity,
                pi."imeiNumber",
                pi."unitPrice",
                pi.notes AS "itemNotes",
                (pi.quantity * pi."unitPrice"::numeric) AS "totalPrice",
                u."empId" AS "createdBy",
                u2."empId" AS "updatedBy",
                u.username,
                p.created_at,
                p."updated_at"
            FROM public.blue_tech_purchases p
            LEFT JOIN public.blue_tech_purchase_items pi
                ON p.id = pi."purchaseId"
            LEFT JOIN public.blue_tech_items i
                ON pi."itemId" = i.id
            LEFT JOIN public.users u
                ON p."createdBy" = u."userId"
            LEFT JOIN public.users u2
                ON p."updatedBy" = u2."userId"
            ${whereSQL}
            ORDER BY p."created_at" DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const data = await AppDataSource.query(query, [...params, limit, offset]);

        const countResult = await AppDataSource.query(
            `SELECT COUNT(*) FROM public.blue_tech_purchases`
        );

        const total = parseInt(countResult[0].count, 10);

        return {
            data,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }

    // ✅ EDIT (single with items)
    public async edit(id: number): Promise<any> {

        const query = `
            SELECT
                p.id,
                p."purchaseNumber",
                p."imeiNumber",
                p."qty",
                p."purchasesPrice",
                p."advancePayment",
                COALESCE(p."settledPayment", '0') AS "settledPayment",
                p."duePayment",
                p."paymentMethod",
                p."supplierName",
                p.notes,
                p."created_at",
                p."updated_at",
                pi."itemId",
                u.username,
                i."itemName",
                i."itemType",
                i."itemConfigurations",
                i."itemPrice",
                pi.quantity,
                pi."imeiNumber",
                pi."unitPrice",
                pi."totalPrice",
                pi.notes AS "itemNotes"
            FROM public.blue_tech_purchases p
            LEFT JOIN public.blue_tech_purchase_items pi
                ON pi."purchaseId" = p.id
            LEFT JOIN public.blue_tech_items i
                ON i.id = pi."itemId"
            LEFT JOIN public.users u
                ON p."createdBy" = u."userId"
            WHERE p.id = $1
        `;

        const rows = await AppDataSource.query(query, [id]);

        if (!rows.length) return null;

        // ✅ GROUP DATA (same pattern you used)
        const purchase = {
            id: rows[0].id,
            purchaseNumber: rows[0].purchaseNumber,
            supplierName: rows[0].supplierName,
            imeiNumber: rows[0].imeiNumber,
            qty: rows[0].qty,
            purchasesPrice: rows[0].purchasesPrice,
            advancePayment: rows[0].advancePayment,
            settledPayment: rows[0].settledPayment,
            duePayment: rows[0].duePayment,
            paymentMethod: rows[0].paymentMethod,
            notes: rows[0].notes,
            username: rows[0].username,
            created_at: rows[0].created_at,
            updated_at: rows[0].updated_at,

            items: rows.map((r: any) => ({
                itemId: r.itemId,
                itemName: r.itemName,
                itemType: r.itemType,
                itemConfigurations: r.itemConfigurations,
                itemPrice: Number(r.itemPrice),   // master price
                unitPrice: Number(r.unitPrice),   // purchase price
                quantity: Number(r.quantity),
                imeiNumber: r.imeiNumber || '',
                totalPrice: Number(r.totalPrice),
                description: r.itemNotes || ''
            }))
        };

        return purchase;
    }

    // ✅ UPDATE (Parent + Replace Items)
    public async update(id: number, data: any): Promise<any> {

        const qr = AppDataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
            const totalPrice = Number(data.purchasesPrice) || 0;
            const advanceApplied = Math.max(0, Number(data.advancePayment) || 0);
            const settledPayment = Math.max(advanceApplied, Number(data.settledPayment) || 0);
            const duePayment = Math.max(0, totalPrice - settledPayment);

            if (settledPayment > totalPrice) {
                throw new Error("Settled payment cannot exceed the purchase price");
            }

            // 👉 1. Get old items
            const oldItems = await qr.manager.find(BlueTechPurchaseItemModel, {
                where: { purchaseId: id }
            });

            const stockRepo = qr.manager.getRepository(BlueTechItemStockModel);

            await this.releaseSupplierAdvance(qr, id);

            // 👉 2. REVERSE OLD STOCK
            for (const old of oldItems) {

                const stock = await stockRepo.findOne({ where: { itemId: old.itemId } });

                if (stock) {
                    stock.onHandQuantity -= old.quantity;
                    stock.availableQuantity -= old.quantity;

                    await stockRepo.save(stock);
                }

                // 👉 movement reverse
                await qr.manager.save(BlueTechStockMovementModel, {
                    itemId: old.itemId,
                    quantity: -old.quantity,
                    files: null,
                    movementType: "PURCHASE_UPDATE_REVERSAL",
                    referenceId: id,
                    note: "Reversal before update"
                });
            }

            // 👉 3. Delete old items
            await qr.manager.delete(BlueTechPurchaseItemModel, { purchaseId: id });

            // 👉 4. Update purchase
            await qr.manager.update(BlueTechPurchaseModel, id, {
                supplierName: data.supplierName,
                imeiNumber: data.imeiNumber,
                qty: data.qty,
                purchasesPrice: data.purchasesPrice,
                advancePayment: advanceApplied.toFixed(2),
                settledPayment: settledPayment.toFixed(2),
                duePayment: duePayment.toFixed(2),
                paymentMethod: data.paymentMethod,
                notes: data.notes,
                updatedBy: data.updatedBy
            });

            if (advanceApplied > 0) {
                await this.allocateSupplierAdvance(
                    qr,
                    id,
                    data.supplierName,
                    advanceApplied,
                    data.updatedBy
                );
            }

            // 👉 5. Insert NEW items
            for (const item of data.items) {

                const newItem = qr.manager.create(BlueTechPurchaseItemModel, {
                    purchaseId: id,
                    itemId: item.itemId,
                    quantity: item.quantity,
                    imeiNumber: item.imeiNumber || null,
                    unitPrice: item.unitPrice,
                    totalPrice: item.totalPrice,
                    notes: item.description || '',
                    createdBy: data.updatedBy
                });

                await qr.manager.save(newItem);

                // 👉 Update Item Price
                await qr.manager.update(BlueTechItemsModel, item.itemId, {
                    itemPrice: item.unitPrice
                });

                // 👉 Update Stock AGAIN
                let stock = await stockRepo.findOne({ where: { itemId: item.itemId } });

                if (stock) {
                    stock.onHandQuantity += item.quantity;
                    stock.availableQuantity += item.quantity;
                    stock.lastPurchasePrice = item.unitPrice;
                    stock.lastPurchaseDate = new Date();
                } else {
                    stock = stockRepo.create({
                        itemId: item.itemId,
                        onHandQuantity: item.quantity,
                        reservedQuantity: 0,
                        availableQuantity: item.quantity,
                        lastPurchasePrice: item.unitPrice,
                        lastPurchaseDate: new Date()
                    });
                }

                await stockRepo.save(stock);

                // 👉 Movement again
                await qr.manager.save(BlueTechStockMovementModel, {
                    itemId: item.itemId,
                    quantity: item.quantity,
                    movementType: "PURCHASE_UPDATE",
                    referenceId: id,
                    note: "After update"
                });
            }

            await qr.commitTransaction();

            return {
                status: true,
                message: "Purchase updated successfully"
            };

        } catch (err) {
            await qr.rollbackTransaction();
            throw err;
        } finally {
            await qr.release();
        }
    }

    private async releaseSupplierAdvance(qr: any, purchaseId: number): Promise<void> {
        const allocations = await qr.manager.query(`
            SELECT "supplierPaymentId", amount
            FROM public.blue_tech_supplier_payment_allocations
            WHERE "purchaseId" = $1
            FOR UPDATE
        `, [purchaseId]);

        for (const allocation of allocations) {
            await qr.manager.query(`
                UPDATE public.blue_tech_supplier_payments
                SET "allocatedAmount" = GREATEST(0, "allocatedAmount" - $1)
                WHERE id = $2
            `, [allocation.amount, allocation.supplierPaymentId]);
        }

        await qr.manager.delete(BlueTechSupplierPaymentAllocationModel, { purchaseId });
    }
    // ✅ DROPDOWN
    public async getDataByItemId(): Promise<{ id: string; label: string }[]> {
        const query = `
            SELECT
                i.id,
                CONCAT(
                    i."itemName",' | ',
                    i."itemPrice",' | ',
                    COALESCE(i."itemConfigurations",'')
                ) AS label,
                i."itemPrice",
                i."itemName",
                i."itemType",
                i."itemConfigurations",
                i."imeiNumber"
            FROM public.blue_tech_items i
            ORDER BY i."itemName"
        `;

        return await AppDataSource.query(query);
    }

    public async getDataBySupplierId(): Promise<{ id: string; label: string }[]> {
        const query = `
            SELECT
                s.id,
                s."supplierName" AS label
            FROM public.blue_tech_supplier s
            ORDER BY s."supplierName"
        `;

        return await AppDataSource.query(query);
    }

    public async getDataByPaymentMethodId(): Promise<{ id: string; label: string }[]> {
        const query = `
            SELECT
                p.id,
                p."paymentMethodName" AS label
            FROM public.blue_tech_payment_method p
            ORDER BY p."paymentMethodName"
        `;

        return await AppDataSource.query(query);
    }

    public async getById(id: number) {
        return await AppDataSource.getRepository(BlueTechPurchaseModel).findOne({
            where: { id },
            relations: ["items"]
        });
    }
}