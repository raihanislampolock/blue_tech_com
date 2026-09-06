import { AppDataSource } from "../../../init";
import { IBlueTechItems, IBlueTechItemsRepository } from "../interfaces/blue_tech_item_interface";
import { BlueTechItemsModel } from "../models/blue_tech_item_model";


export class BlueTechItemsRepository implements IBlueTechItemsRepository {
    private blueTechItemsModel = AppDataSource.getRepository(BlueTechItemsModel);

    public async create(blueTechItemsData: Partial<BlueTechItemsModel>): Promise<BlueTechItemsModel> {
        try {
            const newBlueTechItems = this.blueTechItemsModel.create({
                itemType: blueTechItemsData.itemType,
                manufactureOrigin: blueTechItemsData.manufactureOrigin,
                itemName: blueTechItemsData.itemName,
                itemPrice: blueTechItemsData.itemPrice,
                itemConfigurations: blueTechItemsData.itemConfigurations,
                imeiNumber: blueTechItemsData.imeiNumber,
                createdBy: blueTechItemsData.createdBy,
                createdAt: new Date(),
            });

            return await this.blueTechItemsModel.save(newBlueTechItems);
        } catch (error) {
            console.error("Error in Blue Tech Items:", error);
            throw new Error("Failed to create Blue Tech Item.");
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
                        i."itemType" ILIKE $${params.length + 1} OR
                        i."manufactureOrigin" ILIKE $${params.length + 1} OR
                        i."itemName" ILIKE $${params.length + 1} OR
                        i."itemConfigurations" ILIKE $${params.length + 1} OR
                        i."imeiNumber" ILIKE $${params.length + 1} OR
                        i."itemPrice" ILIKE $${params.length + 1}
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
                i.id,
                i."itemType",
                i."manufactureOrigin",
                i."itemName",
                i."itemPrice",
                i."itemConfigurations",
                i."imeiNumber",
                u."empId" as "createdBy",
                u2."empId" as "updatedBy",
                i.created_at,
                i.updated_at
                from public.blue_tech_items i
                left join public.users u on i."createdBy" = u."userId"
                left join public.users u2 on i."updatedBy" = u2."userId"
                ${whereSQL}
                ORDER BY i."created_at" DESC
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;

            const countQuery = `
               SELECT COUNT(i.id) AS total
               FROM public.blue_tech_items i
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
            console.error("Error fetching filtered blue tech items data:", error);
            throw new Error("Failed to fetch filtered blue tech items data.");
        }
    }

    public async edit(id: number): Promise<any> {
        try {
            const query = `
                select
                i."itemType",
                i."manufactureOrigin",
                i."itemName",
                i."itemPrice",
                i."itemConfigurations",
                i."imeiNumber",
                u."empId" as "createdBy",
                u2."empId" as "updatedBy",
                i.created_at,
                i.updated_at
                from public.blue_tech_items i
                left join public.users u on i."createdBy" = u."userId"
                left join public.users u2 on i."updatedBy" = u2."userId"
            WHERE
                i."id" = $1
            LIMIT 1`;

            const result = await AppDataSource.query(query, [id]);
            return result[0];
        } catch (error) {
            console.error("Error fetching Blue Tech Items record for edit:", error);
            throw new Error("Failed to fetch Blue Tech Items record");
        }
    }

    public async update(id: number, data: IBlueTechItems): Promise<any> {
        try {
            const query = `
                UPDATE public.blue_tech_items
                SET
                    "itemType" = $2,
                    "manufactureOrigin" = $3,
                    "itemName" = $4,
                    "itemPrice" = $5,
                    "itemConfigurations" = $6,
                    "imeiNumber" = $7,
                    "updatedBy" = $8,
                    updated_at = NOW()
                WHERE
                    "id" = $1
            `;

            const params = [
                id,
                data.itemType,
                data.manufactureOrigin,
                data.itemName,
                data.itemPrice,
                data.itemConfigurations,
                data.imeiNumber,
                data.updatedBy
            ];

            await AppDataSource.query(query, params);
            return { status: true, message: 'Blue Tech Items record updated successfully' };

        } catch (error) {
            console.error("Error updating blue tech items data in repository layer:", error);
            throw new Error("Failed to update blue tech items record");
        }
    }
}
