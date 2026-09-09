import { AppDataSource } from "../../../init";
import { IBlueTechAdvancePaymentRepository } from "../interfaces/blue_tech_advance_payment_dashboard_interface";
import { BlueTechSupplierPaymentModel } from "../models/blue_tech_supplier_payment_model";

export class BlueTechAdvancePaymentRepository implements IBlueTechAdvancePaymentRepository {

    private blueTechAdvancePaymentModel =
        AppDataSource.getRepository(BlueTechSupplierPaymentModel);

    public async getAll(
        searchStr: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{
        data: any[];
        total: number;
        totalPages: number;
        currentPage: number;
    }> {

        try {

            const offset = (page - 1) * limit;

            const params: any[] = [];
            let whereSQL = "";

            // ============================================
            // SEARCH
            // ============================================

            if (searchStr && searchStr.trim()) {

                const searchParam = `$${params.length + 1}`;

                whereSQL = `
                    WHERE
                        advance_payment."supplierName" ILIKE ${searchParam}
                        OR CAST(advance_payment.advance_amount AS TEXT) ILIKE ${searchParam}
                        OR CAST(advance_payment.settled_amount AS TEXT) ILIKE ${searchParam}
                        OR CAST(advance_payment.remaining_amount AS TEXT) ILIKE ${searchParam}
                        OR advance_payment."paymentMethod" ILIKE ${searchParam}
                        OR advance_payment.notes ILIKE ${searchParam}
                        OR CAST(advance_payment.created_by AS TEXT) ILIKE ${searchParam}
                `;

                params.push(`%${searchStr.trim()}%`);
            }

            // ============================================
            // MAIN QUERY
            // ============================================

            const query = `
                SELECT
                    advance_payment.id,
                    advance_payment."supplierName",
                    advance_payment.advance_amount,
                    advance_payment.settled_amount,
                    advance_payment.remaining_amount,
                    advance_payment."paymentMethod",
                    advance_payment.notes,
                    advance_payment.created_by,
                    advance_payment.created_at

                FROM (
                    SELECT
                        sp.id,
                        sp."supplierName",

                        -- Original advance payment
                        sp.amount AS advance_amount,

                        -- Total amount settled/allocated
                        COALESCE(SUM(spa.amount), 0) AS settled_amount,

                        -- Remaining advance amount
                        sp.amount - COALESCE(SUM(spa.amount), 0) AS remaining_amount,

                        sp."paymentMethod",
                        sp.notes,

                        u."empId" AS created_by,

                        sp.created_at

                    FROM public.blue_tech_supplier_payments sp

                    LEFT JOIN public.blue_tech_supplier_payment_allocations spa
                        ON sp.id = spa."supplierPaymentId"

                    LEFT JOIN public.users u
                        ON sp."createdBy" = u."userId"

                    GROUP BY
                        sp.id,
                        sp."supplierName",
                        sp.amount,
                        sp."paymentMethod",
                        sp.notes,
                        u."empId",
                        sp.created_at

                ) AS advance_payment

                ${whereSQL}

                ORDER BY advance_payment.created_at DESC

                LIMIT $${params.length + 1}
                OFFSET $${params.length + 2}
            `;

            // ============================================
            // COUNT QUERY
            // ============================================

            const countQuery = `
                SELECT COUNT(*) AS total

                FROM (
                    SELECT
                        sp.id,
                        sp."supplierName",
                        sp.amount AS advance_amount,
                        COALESCE(SUM(spa.amount), 0) AS settled_amount,
                        sp.amount - COALESCE(SUM(spa.amount), 0) AS remaining_amount,
                        sp."paymentMethod",
                        sp.notes,
                        u."empId" AS created_by,
                        sp.created_at

                    FROM public.blue_tech_supplier_payments sp

                    LEFT JOIN public.blue_tech_supplier_payment_allocations spa
                        ON sp.id = spa."supplierPaymentId"

                    LEFT JOIN public.users u
                        ON sp."createdBy" = u."userId"

                    GROUP BY
                        sp.id,
                        sp."supplierName",
                        sp.amount,
                        sp."paymentMethod",
                        sp.notes,
                        u."empId",
                        sp.created_at

                ) AS advance_payment

                ${whereSQL}
            `;

            // ============================================
            // EXECUTE QUERIES
            // ============================================

            const data = await AppDataSource.query(
                query,
                [...params, limit, offset]
            );

            const countResult = await AppDataSource.query(
                countQuery,
                params
            );

            const total = parseInt(
                countResult[0]?.total || "0",
                10
            );

            const totalPages = Math.ceil(total / limit);

            return {
                data,
                total,
                totalPages,
                currentPage: page,
            };

        } catch (error) {

            console.error(
                "Error fetching filtered blue tech AdvancePayment data:",
                error
            );

            throw new Error(
                "Failed to fetch filtered blue tech AdvancePayment data."
            );
        }
    }
}
