import { AppDataSource } from "../../../init";
import { IBlueTechSupplier, IBlueTechSupplierRepository } from "../interfaces/blue_tech_supplier_interface";
import { BlueTechSupplierModel } from "../models/blue_tech_supplier_model";


export class BlueTechSupplierRepository implements IBlueTechSupplierRepository {
    private blueTechSupplierModel = AppDataSource.getRepository(BlueTechSupplierModel);

    public async create(blueTechSupplierData: Partial<BlueTechSupplierModel>): Promise<BlueTechSupplierModel> {
        try {
            const newBlueTechSupplier = this.blueTechSupplierModel.create({
                supplierName: blueTechSupplierData.supplierName,
                supplierEmail: blueTechSupplierData.supplierEmail,
                supplierNumber: blueTechSupplierData.supplierNumber,
                supplierAddress: blueTechSupplierData.supplierAddress,
                note: blueTechSupplierData.note,
                createdBy: blueTechSupplierData.createdBy,
                createdAt: new Date(),
            });

            return await this.blueTechSupplierModel.save(newBlueTechSupplier);
        } catch (error) {
            console.error("Error in Blue Tech Supplier Name:", error);
            throw new Error("Failed to create Blue Tech Supplier Name.");
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
                        s."supplierName" ILIKE $${params.length + 1} OR
                        s."supplierEmail" ILIKE $${params.length + 1} OR
                        s."supplierNumber" ILIKE $${params.length + 1} OR
                        s."supplierAddress" ILIKE $${params.length + 1} OR
                        s."note" ILIKE $${params.length + 1}
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
                s.id,
                s."supplierName",
                s."supplierEmail",
                s."supplierNumber",
                s."supplierAddress",
                s."note",
                u."empId" as "createdBy",
                u2."empId" as "updatedBy",
                s.created_at,
                s.updated_at
                from public.blue_tech_supplier s
                left join public.users u on s."createdBy" = u."userId"
                left join public.users u2 on s."updatedBy" = u2."userId"
                ${whereSQL}
                ORDER BY s."created_at" DESC
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;

            const countQuery = `
               SELECT COUNT(s.id) AS total
               FROM public.blue_tech_supplier s
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
            console.error("Error fetching filtered blue tech Supplier data:", error);
            throw new Error("Failed to fetch filtered blue tech Supplier data.");
        }
    }

    public async edit(id: number): Promise<any> {
        try {
            const query = `
            select
                s.id,
                s."supplierName",
                s."supplierEmail",
                s."supplierNumber",
                s."supplierAddress",
                s."note",
                u."empId" as "createdBy",
                u2."empId" as "updatedBy",
                s.created_at,
                s.updated_at
                from public.blue_tech_supplier s
                left join public.users u on s."createdBy" = u."userId"
                left join public.users u2 on s."updatedBy" = u2."userId"
            WHERE
                s."id" = $1
            LIMIT 1`;

            const result = await AppDataSource.query(query, [id]);
            return result[0];
        } catch (error) {
            console.error("Error fetching Blue Tech Supplier record for edit:", error);
            throw new Error("Failed to fetch Blue Tech Supplier record");
        }
    }

    public async update(id: number, data: IBlueTechSupplier): Promise<any> {
        try {
            const query = `
                UPDATE public.blue_tech_supplier
                SET
                    "supplierName" = $2,
                    "supplierEmail" = $3,
                    "supplierNumber" = $4,
                    "supplierAddress" = $5,
                    "note" = $6,
                    "updatedBy" = $7,
                    updated_at = NOW()
                WHERE
                    "id" = $1
            `;

            const params = [
                id,
                data.supplierName,
                data.supplierEmail,
                data.supplierNumber,
                data.supplierAddress,
                data.note,
                data.updatedBy
            ];

            await AppDataSource.query(query, params);
            return { status: true, message: 'Blue Tech supplier record updated successfully' };

        } catch (error) {
            console.error("Error updating blue tech supplier data in repository layer:", error);
            throw new Error("Failed to update blue tech supplier record");
        }
    }
}
