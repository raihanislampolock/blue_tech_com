import { AppDataSource } from "../../../init";
import { IBlueTechPaymentMethod, IBlueTechPaymentMethodRepository } from "../interfaces/blue_tech_payment_method_interface";
import { BlueTechPaymentMethodModel } from "../models/blue_tech_payment_method_model";


export class BlueTechPaymentMethodRepository implements IBlueTechPaymentMethodRepository {
    private blueTechPaymentMethodModel = AppDataSource.getRepository(BlueTechPaymentMethodModel);

    public async create(blueTechPaymentMethodData: Partial<BlueTechPaymentMethodModel>): Promise<BlueTechPaymentMethodModel> {
        try {
            const newBlueTechPaymentMethod = this.blueTechPaymentMethodModel.create({
                paymentMethodName: blueTechPaymentMethodData.paymentMethodName,
                paymentMethodDescription: blueTechPaymentMethodData.paymentMethodDescription,
                createdBy: blueTechPaymentMethodData.createdBy,
                createdAt: new Date(),
            });

            return await this.blueTechPaymentMethodModel.save(newBlueTechPaymentMethod);
        } catch (error) {
            console.error("Error in Blue Tech Payment Method Name:", error);
            throw new Error("Failed to create Blue Tech Payment Method Name.");
        }
    }

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
                        p."paymentMethodName" ILIKE $${params.length + 1} OR
                        p."paymentMethodDescription" ILIKE $${params.length + 1}
                    )
                `);
                params.push(`%${searchStr}%`);
            }


            if (whereClauses.length === 0) {
                whereClauses.push("1 = 1");
            }

            const whereSQL = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

            const query = `
                select
                p.id,
                p."paymentMethodName",
                p."paymentMethodDescription",
                p."createdBy",
                p."updatedBy",
                u."empId" as "createdBy",
                u2."empId" as "updatedBy",
                p.created_at,
                p.updated_at
                from public.blue_tech_payment_method p
                left join public.users u on p."createdBy" = u."userId"
                left join public.users u2 on p."updatedBy" = u2."userId"
                ${whereSQL}
                ORDER BY p."created_at" DESC
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;

            const countQuery = `
               SELECT COUNT(p.id) AS total
               FROM public.blue_tech_payment_method p
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
            console.error("Error fetching filtered blue tech Payment Method data:", error);
            throw new Error("Failed to fetch filtered blue tech Payment Method data.");
        }
    }

    public async edit(id: number): Promise<any> {
        try {
            const query = `
            select
                    p.id,
                    p."paymentMethodName",
                    p."paymentMethodDescription",
                    p."createdBy",
                    p."updatedBy",
                    u."empId" as "createdBy",
                    u2."empId" as "updatedBy",
                    p.created_at,
                    p.updated_at
                    from public.blue_tech_payment_method p
                    left join public.users u on p."createdBy" = u."userId"
                    left join public.users u2 on p."updatedBy" = u2."userId"
            WHERE
                p."id" = $1
            LIMIT 1`;

            const result = await AppDataSource.query(query, [id]);
            return result[0];
        } catch (error) {
            console.error("Error fetching Blue Tech Payment Method record for edit:", error);
            throw new Error("Failed to fetch Blue Tech Payment Method record");
        }
    }

    public async update(id: number, data: IBlueTechPaymentMethod): Promise<any> {
        try {
            const query = `
                UPDATE public.blue_tech_payment_method
                SET
                    "paymentMethodName" = $2,
                    "paymentMethodDescription" = $3,
                    "updatedBy" = $4,
                    updated_at = NOW()
                WHERE
                    "id" = $1
            `;

            const params = [
                id,
                data.paymentMethodName,
                data.paymentMethodDescription,
                data.updatedBy
            ];

            await AppDataSource.query(query, params);
            return { status: true, message: 'Blue Tech Payment Method record updated successfully' };

        } catch (error) {
            console.error("Error updating blue tech Payment Method data in repository layer:", error);
            throw new Error("Failed to update blue tech Payment Method record");
        }
    }
}
