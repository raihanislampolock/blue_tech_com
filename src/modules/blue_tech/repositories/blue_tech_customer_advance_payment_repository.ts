import { AppDataSource } from "../../../init";
import { IBlueTechCustomerAdvancePaymentRepository } from "../interfaces/blue_tech_customer_advance_payment_interface";
import { BlueTechCustomerAdvanceModel } from "../models/blue_tech_customer_advance_model";

export class BlueTechCustomerAdvancePaymentRepository implements IBlueTechCustomerAdvancePaymentRepository {

    private blueTechCustomerAdvancePaymentModel =
        AppDataSource.getRepository(BlueTechCustomerAdvanceModel);

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
                        advance_payment."customerName" ILIKE ${searchParam}
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
                    advance_payment."customerName",
                    advance_payment.advance_amount,
                    advance_payment.settled_amount,
                    advance_payment.remaining_amount,
                    advance_payment."paymentMethod",
                    advance_payment.notes,
                    advance_payment.created_by,
                    advance_payment.created_at

                FROM (
                    SELECT
                        ca.id,
                        c."customerName",

                        -- Original advance payment
                        ca.amount AS advance_amount,

                        -- Total amount settled/allocated
                        COALESCE(SUM(caa.amount), 0) AS settled_amount,

                        -- Remaining advance amount
                        ca.amount - COALESCE(SUM(caa.amount), 0) AS remaining_amount,

                        pm."paymentMethodName" AS "paymentMethod",
                        ca.notes,

                        COALESCE(u."empId", ca."createdBy") AS created_by,

                        ca.created_at

                    FROM public.blue_tech_customer_advances ca

                    INNER JOIN public.blue_tech_customers c
                        ON ca."customerId" = c.id

                    LEFT JOIN public.blue_tech_customer_advance_allocations caa
                        ON ca.id = caa."advanceId"

                    LEFT JOIN public.blue_tech_payment_method pm
                        ON ca."paymentMethodId" = pm.id

                    LEFT JOIN public.users u
                        ON ca."createdBy" = u."userId"

                    GROUP BY
                        ca.id,
                        c."customerName",
                        ca.amount,
                        pm."paymentMethodName",
                        ca.notes,
                        u."empId",
                        ca."createdBy",
                        ca.created_at

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
                        ca.id,
                        c."customerName",
                        ca.amount AS advance_amount,
                        COALESCE(SUM(caa.amount), 0) AS settled_amount,
                        ca.amount - COALESCE(SUM(caa.amount), 0) AS remaining_amount,
                        pm."paymentMethodName" AS "paymentMethod",
                        ca.notes,
                        COALESCE(u."empId", ca."createdBy") AS created_by,
                        ca.created_at

                    FROM public.blue_tech_customer_advances ca

                    INNER JOIN public.blue_tech_customers c
                        ON ca."customerId" = c.id

                    LEFT JOIN public.blue_tech_customer_advance_allocations caa
                        ON ca.id = caa."advanceId"

                    LEFT JOIN public.blue_tech_payment_method pm
                        ON ca."paymentMethodId" = pm.id

                    LEFT JOIN public.users u
                        ON ca."createdBy" = u."userId"

                    GROUP BY
                        ca.id,
                        c."customerName",
                        ca.amount,
                        pm."paymentMethodName",
                        ca.notes,
                        u."empId",
                        ca."createdBy",
                        ca.created_at

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
                "Error fetching filtered blue tech customer advance data:",
                error
            );

            throw new Error(
                "Failed to fetch filtered blue tech customer advance data."
            );
        }
    }
}
