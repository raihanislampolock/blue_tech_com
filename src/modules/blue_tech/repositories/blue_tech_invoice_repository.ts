import { AppDataSource } from "../../../init";
import { IBlueTechInvoice, IBlueTechInvoiceItem, IBlueTechInvoiceRepository } from "../interfaces/blue_tech_invoice_interface";
import { BlueTechInvoiceModel } from "../models/blue_tech_invoice_modal";
import { BlueTechInvoiceItemModel } from "../models/blue_tech_invoice_item_modal";
import { BlueTechCustomerModel } from "../models/blue_tech_customer_model";
import { BlueTechCustomerAdvanceModel } from "../models/blue_tech_customer_advance_model";
import { BlueTechCustomerAdvanceAllocationModel } from "../models/blue_tech_customer_advance_allocation_model";
import { BlueTechItemsModel } from "../models/blue_tech_item_model";
import { BlueTechItemStockModel } from "../models/blue_tech_itemstock_model";
import { BlueTechStockMovementModel } from "../models/blue_tech_stock_movement_model";
import { BlueTechPaymentMethodModel } from "../models/blue_tech_payment_method_model";

export class BlueTechInvoiceRepository implements IBlueTechInvoiceRepository {
    private invoiceRepo = AppDataSource.getRepository(BlueTechInvoiceModel);

    public async create(data: IBlueTechInvoice): Promise<BlueTechInvoiceModel> {
        const qr = AppDataSource.createQueryRunner();
        await qr.connect();
        await qr.startTransaction();

        try {
            const customer = await qr.manager.findOne(BlueTechCustomerModel, { where: { id: data.customerId } });
            if (!customer) throw new Error("Customer not found");
            if (!data.items?.length) throw new Error("At least one item is required");

            const subtotal = data.items.reduce((sum, item) => sum + this.lineTotal(item), 0);
            const discountAmount = Math.max(0, Number(data.discountAmount) || 0);
            const taxAmount = Math.max(0, Number(data.taxAmount) || 0);
            const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);
            const advanceAmountApplied = Math.max(0, Number(data.advanceAmountApplied) || 0);
            const paidAmount = Math.max(0, Number(data.paidAmount) || 0);

            if (advanceAmountApplied + paidAmount > totalAmount + 0.005) {
                throw new Error("Paid and advance amounts cannot exceed the invoice total");
            }

            const savedInvoice = await qr.manager.save(BlueTechInvoiceModel, qr.manager.create(BlueTechInvoiceModel, {
                invoiceNumber: data.invoiceNumber,
                customerId: customer.id,
                invoiceDate: data.invoiceDate || new Date(),
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                invoiceStatus: data.invoiceStatus || "ISSUED",
                paymentStatus: this.paymentStatus(totalAmount, paidAmount + advanceAmountApplied),
                paymentMethodId: data.paymentMethodId || null,
                subtotal,
                discountAmount,
                taxAmount,
                totalAmount,
                paidAmount,
                advanceAmountApplied,
                dueAmount: Math.max(0, totalAmount - paidAmount - advanceAmountApplied),
                customerNameSnapshot: customer.customerName,
                customerPhoneSnapshot: customer.phoneNumber || null,
                billingAddressSnapshot: customer.billingAddress || null,
                notes: data.notes || null,
                createdBy: data.createdBy || "system"
            } as any));

            for (const item of data.items) {
                const quantity = Number(item.quantity);
                const unitPrice = Number(item.unitPrice);
                if (!Number.isInteger(quantity) || quantity <= 0 || unitPrice < 0) {
                    throw new Error("Invoice item quantity and price are invalid");
                }

                const stockRows = await qr.manager.query(`
                    SELECT id, "onHandQuantity", "reservedQuantity", "availableQuantity"
                    FROM public.blue_tech_item_stocks
                    WHERE "itemId" = $1
                    FOR UPDATE
                `, [item.itemId]);
                const stock = stockRows[0];
                if (!stock || Number(stock.availableQuantity) < quantity) {
                    throw new Error(`Insufficient stock for item ${item.itemId}`);
                }

                const masterItem = await qr.manager.findOne(BlueTechItemsModel, { where: { id: item.itemId } });
                if (!masterItem) throw new Error(`Item ${item.itemId} not found`);

                await qr.manager.save(BlueTechInvoiceItemModel, qr.manager.create(BlueTechInvoiceItemModel, {
                    invoiceId: savedInvoice.id,
                    itemId: item.itemId,
                    quantity,
                    unitPrice,
                    totalPrice: quantity * unitPrice,
                    itemDiscountAmount: Number(item.itemDiscountAmount) || 0,
                    taxAmount: Number(item.taxAmount) || 0,
                    purchaseItemId: item.purchaseItemId || null,
                    itemNameSnapshot: masterItem.itemName,
                    imeiNumber: item.imeiNumber || masterItem.imeiNumber || null,
                    notes: item.notes || null,
                    createdBy: data.createdBy || "system"
                } as any));

                await qr.manager.update(BlueTechItemStockModel, stock.id, {
                    onHandQuantity: Number(stock.onHandQuantity) - quantity,
                    availableQuantity: Number(stock.availableQuantity) - quantity
                });
                await qr.manager.save(BlueTechStockMovementModel, {
                    itemId: item.itemId,
                    quantity: -quantity,
                    movementType: "SALE",
                    referenceId: savedInvoice.id,
                    note: "Invoice created"
                });
            }

            if (advanceAmountApplied > 0) {
                await this.allocateAdvance(qr, savedInvoice.id, customer.id, advanceAmountApplied, data.createdBy || "system");
            }

            await qr.commitTransaction();
            return savedInvoice;
        } catch (error) {
            await qr.rollbackTransaction();
            throw error;
        } finally {
            await qr.release();
        }
    }

    public async recordCustomerAdvance(data: any): Promise<any> {
        const amount = Number(data.amount) || 0;
        if (!data.customerId || amount <= 0) throw new Error("Customer and a positive advance amount are required");
        const existing = await AppDataSource.getRepository(BlueTechCustomerModel).findOne({ where: { id: Number(data.customerId) } });
        if (!existing) throw new Error("Customer not found");
        const advanceNumber = data.advanceNumber || await this.generateAdvanceNumber();
        return AppDataSource.getRepository(BlueTechCustomerAdvanceModel).save({
            customerId: existing.id, advanceNumber, amount: amount.toFixed(2), allocatedAmount: "0.00",
            remainingAmount: amount.toFixed(2), status: "OPEN", paymentMethodId: data.paymentMethodId || null,
            receivedDate: data.receivedDate || new Date(), notes: data.notes || null, createdBy: data.createdBy || "system"
        });
    }

    public async getCustomerAdvanceBalance(customerId: number): Promise<any> {
        const rows = await AppDataSource.query(`
            SELECT COALESCE(SUM(amount), 0) AS "totalAdvance",
                   COALESCE(SUM("allocatedAmount"), 0) AS "allocatedAdvance",
                   COALESCE(SUM("remainingAmount"), 0) AS "availableAdvance"
            FROM public.blue_tech_customer_advances
            WHERE "customerId" = $1 AND status NOT IN ('CANCELLED', 'REFUNDED')
        `, [customerId]);
        const row = rows[0] || {};
        return { totalAdvance: Number(row.totalAdvance || 0), allocatedAdvance: Number(row.allocatedAdvance || 0), availableAdvance: Number(row.availableAdvance || 0) };
    }

    public async getAll(searchStr: string, page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        let whereSQL = "";  

        if (searchStr) {
            whereSQL = `
                WHERE inv."invoiceNumber" ILIKE $1
                OR c."customerName" ILIKE $1
                OR ii."itemNameSnapshot" ILIKE $1
                OR i."itemName" ILIKE $1
            `;  

            params.push(`%${searchStr}%`);
        }   

        const query = `
             SELECT
                inv.id,
                inv."invoiceNumber",
                inv."customerId",
                inv."invoiceDate",
                inv."dueDate",
                inv."invoiceStatus",
                inv."paymentStatus",
                inv."paymentMethodId",  
                inv.subtotal,
                inv."discountAmount",
                inv."totalAmount",
                inv."paidAmount",
                inv."advanceAmountApplied",
                inv."dueAmount",    
                inv."customerNameSnapshot",
                inv."customerPhoneSnapshot",
                inv."billingAddressSnapshot",
                inv.notes,  
                c."customerName",
                c."phoneNumber",    
                ii.id AS "invoiceItemId",
                ii."itemId",    
                COALESCE(
                    ii."itemNameSnapshot",
                    i."itemName"
                ) AS "itemName",    
                i."itemType",
                i."itemConfigurations",
                i."manufactureOrigin",  
                ii."imeiNumber",
                ii.quantity,
                ii."unitPrice",
                ii."itemDiscountAmount",
                ii."taxAmount",
                ii."totalPrice",
                ii.notes AS "itemNotes",    
                u."empId" AS "createdBy",
                u2."empId" AS "updatedBy",  
                inv."createdAt",
                inv."updatedAt" 
            FROM public.blue_tech_invoices inv  
            LEFT JOIN public.blue_tech_customers c ON c.id = inv."customerId"  
            LEFT JOIN public.blue_tech_invoice_items ii ON inv.id = ii."invoiceId"  
            LEFT JOIN public.blue_tech_items i ON ii."itemId" = i.id     
            LEFT JOIN public.users u ON inv."createdBy" = u."userId" 
            LEFT JOIN public.users u2 ON inv."updatedBy" = u2."userId"   
            ${whereSQL} 
            ORDER BY inv."createdAt" DESC   

            LIMIT $${params.length + 1}
            OFFSET $${params.length + 2}
        `;  

        const data = await AppDataSource.query(
            query,
            [...params, limit, offset]
        );  

        const countParams: any[] = [];
        let countWhereSQL = ""; 

        if (searchStr) {
            countWhereSQL = `
                WHERE inv."invoiceNumber" ILIKE $1
                OR c."customerName" ILIKE $1
                OR ii."itemNameSnapshot" ILIKE $1
                OR i."itemName" ILIKE $1
            `;  

            countParams.push(`%${searchStr}%`);
        }   

        const countResult = await AppDataSource.query(
            `
            SELECT COUNT(DISTINCT inv.id)
            FROM public.blue_tech_invoices inv  
            LEFT JOIN public.blue_tech_customers c ON c.id = inv."customerId"  
            LEFT JOIN public.blue_tech_invoice_items ii ON inv.id = ii."invoiceId"  
            LEFT JOIN public.blue_tech_items i ON ii."itemId" = i.id   

            ${countWhereSQL}
            `,
            countParams
        );  

        const total = parseInt(countResult[0].count, 10);   

        return {
            data,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        };
    }

    public async edit(id: number): Promise<any | null> {
        const invoice = await this.invoiceRepo.findOne({ where: { id }, relations: { customer: true, items: { item: true }, advanceAllocations: true } });
        if (!invoice) return null;
        return invoice;
    }

    public async update(id: number, data: IBlueTechInvoice): Promise<any> {

        const existing = await this.edit(id);

        if (!existing) {
            throw new Error("Invoice not found");
        }

        // Paid invoices cannot be updated
        if (String(existing.paymentStatus).toUpperCase() === "PAID") {
            throw new Error("Paid invoices cannot be updated");
        }

        const totalAmount = Number(data.totalAmount ?? existing.totalAmount ?? 0);
        const paidAmount = Number(data.paidAmount ?? 0);
        const advanceAmountApplied = Number(
            data.advanceAmountApplied ?? existing.advanceAmountApplied ?? 0
        );

        const dueAmount = Math.max(
            0,
            totalAmount - advanceAmountApplied - paidAmount
        );

        let paymentStatus = "UNPAID";

        if (dueAmount <= 0) {
            paymentStatus = "PAID";
        } else if (paidAmount > 0 || advanceAmountApplied > 0) {
            paymentStatus = "PARTIALLY_PAID";
        }

        await this.invoiceRepo.update(id, {
            customerId: data.customerId,
            dueDate: data.dueDate || null,
            notes: data.notes || null,
            paymentMethodId: data.paymentMethodId || null,

            // Payment information
            paidAmount,
            advanceAmountApplied,
            dueAmount,
            paymentStatus,

            updatedBy: data.updatedBy || "system"
        });

        return this.edit(id);
    }

    public async generateInvoiceNumber(customerCode = "GEN"): Promise<string> {
        const rows = await AppDataSource.query(`SELECT CONCAT('INV/', TO_CHAR(NOW(), 'YYYYMM'), '/', $1::text, '-', LPAD(nextval('blue_tech_invoice_seq')::text, 3, '0')) AS "invoiceNumber"`, [customerCode]);
        return rows[0].invoiceNumber;
    }

    public async getItemDropdown(): Promise<any[]> {
        return AppDataSource.query(`
            SELECT DISTINCT
                i.id,
                pi.id AS "purchaseItemId",
                i."itemName" AS label,
                i."itemPrice",
                i."itemName",
                i."itemType",
                i."itemConfigurations",
                pi."imeiNumber"
            FROM public.blue_tech_items i
            INNER JOIN public.blue_tech_purchase_items pi
                ON pi."itemId" = i.id
                AND NULLIF(TRIM(pi."imeiNumber"), '') IS NOT NULL
            WHERE NOT EXISTS (
                SELECT 1
                FROM public.blue_tech_invoice_items ii
                WHERE ii."purchaseItemId" = pi.id
                   OR (ii."itemId" = pi."itemId" AND ii."imeiNumber" = pi."imeiNumber")
            )
            UNION ALL
            SELECT
                i.id,
                NULL AS "purchaseItemId",
                i."itemName" AS label,
                i."itemPrice",
                i."itemName",
                i."itemType",
                i."itemConfigurations",
                i."imeiNumber"
            FROM public.blue_tech_items i
            WHERE NOT EXISTS (
                SELECT 1
                FROM public.blue_tech_purchase_items pi
                WHERE pi."itemId" = i.id
                  AND NULLIF(TRIM(pi."imeiNumber"), '') IS NOT NULL
            )
                ORDER BY 4
        `);
    }

    public async getCustomerDropdown(): Promise<any[]> {
        return AppDataSource.query(`SELECT id, "customerName" AS label, "phoneNumber", email, "billingAddress" FROM public.blue_tech_customers WHERE "isActive" = true ORDER BY "customerName"`);
    }

    public async getPaymentMethodDropdown(): Promise<any[]> {
        return AppDataSource.getRepository(BlueTechPaymentMethodModel).find({ order: { paymentMethodName: "ASC" } });
    }

    private lineTotal(item: IBlueTechInvoiceItem): number {
        return Math.max(0, Number(item.quantity) || 0) * Math.max(0, Number(item.unitPrice) || 0) - (Number(item.itemDiscountAmount) || 0) + (Number(item.taxAmount) || 0);
    }

    private paymentStatus(total: number, paid: number): string {
        if (paid <= 0) return "UNPAID";
        if (paid >= total) return "PAID";
        return "PARTIALLY_PAID";
    }

    private async allocateAdvance(qr: any, invoiceId: number, customerId: number, amount: number, createdBy: string): Promise<void> {
        const advances = await qr.manager.query(`SELECT id, amount, "allocatedAmount", "remainingAmount" FROM public.blue_tech_customer_advances WHERE "customerId" = $1 AND status IN ('OPEN', 'PARTIALLY_USED') AND "remainingAmount" > 0 ORDER BY "receivedDate" ASC, id ASC FOR UPDATE`, [customerId]);
        let remaining = amount;
        for (const advance of advances) {
            if (remaining <= 0.005) break;
            const available = Number(advance.remainingAmount);
            const allocation = Math.min(remaining, available);
            const newAllocated = Number(advance.allocatedAmount) + allocation;
            const newRemaining = Number(advance.amount) - newAllocated;
            await qr.manager.update(BlueTechCustomerAdvanceModel, advance.id, { allocatedAmount: newAllocated.toFixed(2), remainingAmount: newRemaining.toFixed(2), status: newRemaining <= 0.005 ? "USED" : "PARTIALLY_USED" });
            await qr.manager.save(BlueTechCustomerAdvanceAllocationModel, { advanceId: advance.id, invoiceId, amount: allocation.toFixed(2), createdBy });
            remaining -= allocation;
        }
        if (remaining > 0.005) throw new Error(`Customer advance balance is insufficient by ${remaining.toFixed(2)}`);
    }

    private async generateAdvanceNumber(): Promise<string> {
        const rows = await AppDataSource.query(`SELECT CONCAT('ADV/', TO_CHAR(NOW(), 'YYYYMM'), '/', LPAD(nextval('blue_tech_customer_advance_seq')::text, 3, '0')) AS number`);
        return rows[0].number;
    }
}
