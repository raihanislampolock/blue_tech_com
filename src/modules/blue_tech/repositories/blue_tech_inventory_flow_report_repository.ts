import { AppDataSource } from "../../../init";
import { IBlueTechInventoryFlowReportRepository } from "../interfaces/blue_tech_inventory_flow_report_interface";

export class BlueTechInventoryFlowReportRepository implements IBlueTechInventoryFlowReportRepository {
    public async getReport(year: number): Promise<{ year: number; monthly: any[]; itemSummary: any[] }> {
        const monthly = await AppDataSource.query(`
            WITH months AS (
                SELECT month_number, TO_CHAR(MAKE_DATE($1, month_number, 1), 'Mon') AS month_name
                FROM generate_series(1, 12) AS month_number
            ), ordered AS (
                SELECT EXTRACT(MONTH FROM poi.created_at)::int AS month_number,
                       SUM(COALESCE(poi.quantity, 0)) AS quantity,
                       SUM(COALESCE(NULLIF(poi."totalPrice", '')::numeric, poi.quantity * NULLIF(poi."unitPrice", '')::numeric, 0)) AS value
                FROM public.blue_tech_purchase_order_items poi
                WHERE EXTRACT(YEAR FROM poi.created_at) = $1
                GROUP BY 1
            ), purchased AS (
                SELECT EXTRACT(MONTH FROM pi.created_at)::int AS month_number,
                       SUM(COALESCE(pi.quantity, 0)) AS quantity,
                       SUM(COALESCE(NULLIF(pi."totalPrice", '')::numeric, pi.quantity * NULLIF(pi."unitPrice", '')::numeric, 0)) AS value
                FROM public.blue_tech_purchase_items pi
                WHERE EXTRACT(YEAR FROM pi.created_at) = $1
                GROUP BY 1
            ), sold AS (
                SELECT EXTRACT(MONTH FROM inv."invoiceDate")::int AS month_number,
                       SUM(COALESCE(ii.quantity, 0)) AS quantity,
                       SUM(COALESCE(ii."totalPrice", 0)) AS value
                FROM public.blue_tech_invoice_items ii
                INNER JOIN public.blue_tech_invoices inv ON inv.id = ii."invoiceId"
                WHERE EXTRACT(YEAR FROM inv."invoiceDate") = $1
                  AND COALESCE(inv."invoiceStatus", 'DRAFT') <> 'CANCELLED'
                GROUP BY 1
            )
            SELECT m.month_number AS "monthNumber", m.month_name AS "monthName",
                   COALESCE(o.quantity, 0)::numeric AS "orderedQty",
                   COALESCE(o.value, 0)::numeric AS "orderedValue",
                   COALESCE(p.quantity, 0)::numeric AS "purchasedQty",
                   COALESCE(p.value, 0)::numeric AS "purchasedValue",
                   COALESCE(s.quantity, 0)::numeric AS "soldQty",
                   COALESCE(s.value, 0)::numeric AS "soldValue",
                   (COALESCE(p.quantity, 0) - COALESCE(s.quantity, 0))::numeric AS "netStockQty",
                   (COALESCE(s.value, 0) - COALESCE(p.value, 0))::numeric AS "grossMargin"
            FROM months m
            LEFT JOIN ordered o ON o.month_number = m.month_number
            LEFT JOIN purchased p ON p.month_number = m.month_number
            LEFT JOIN sold s ON s.month_number = m.month_number
            ORDER BY m.month_number
        `, [year]);

        const itemSummary = await AppDataSource.query(`
            WITH activity AS (
                SELECT poi."itemId" AS item_id, SUM(poi.quantity) AS ordered_qty, 0::numeric AS purchased_qty, 0::numeric AS sold_qty,
                       SUM(COALESCE(NULLIF(poi."totalPrice", '')::numeric, poi.quantity * NULLIF(poi."unitPrice", '')::numeric, 0)) AS ordered_value,
                       0::numeric AS purchased_value, 0::numeric AS sold_value
                FROM public.blue_tech_purchase_order_items poi
                WHERE EXTRACT(YEAR FROM poi.created_at) = $1
                GROUP BY poi."itemId"
                UNION ALL
                SELECT pi."itemId", 0, SUM(pi.quantity), 0,
                       0, SUM(COALESCE(NULLIF(pi."totalPrice", '')::numeric, pi.quantity * NULLIF(pi."unitPrice", '')::numeric, 0)), 0
                FROM public.blue_tech_purchase_items pi
                WHERE EXTRACT(YEAR FROM pi.created_at) = $1
                GROUP BY pi."itemId"
                UNION ALL
                SELECT ii."itemId", 0, 0, SUM(ii.quantity), 0, 0, SUM(COALESCE(ii."totalPrice", 0))
                FROM public.blue_tech_invoice_items ii
                INNER JOIN public.blue_tech_invoices inv ON inv.id = ii."invoiceId"
                WHERE EXTRACT(YEAR FROM inv."invoiceDate") = $1
                  AND COALESCE(inv."invoiceStatus", 'DRAFT') <> 'CANCELLED'
                GROUP BY ii."itemId"
            )
            SELECT a.item_id AS "itemId", COALESCE(i."itemName", 'Unknown item') AS "itemName",
                   SUM(a.ordered_qty)::numeric AS "orderedQty", SUM(a.ordered_value)::numeric AS "orderedValue",
                   SUM(a.purchased_qty)::numeric AS "purchasedQty", SUM(a.purchased_value)::numeric AS "purchasedValue",
                   SUM(a.sold_qty)::numeric AS "soldQty", SUM(a.sold_value)::numeric AS "soldValue",
                   (SUM(a.purchased_qty) - SUM(a.sold_qty))::numeric AS "netStockQty",
                   (SUM(a.sold_value) - SUM(a.purchased_value))::numeric AS "grossMargin"
            FROM activity a
            LEFT JOIN public.blue_tech_items i ON i.id = a.item_id
            GROUP BY a.item_id, i."itemName"
            ORDER BY SUM(a.sold_value) DESC, "itemName"
        `, [year]);

        return { year, monthly, itemSummary };
    }
}