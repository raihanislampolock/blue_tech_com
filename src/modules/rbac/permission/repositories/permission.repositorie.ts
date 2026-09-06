import { AppDataSource } from "../../../../init";
import { IPermissionRepository, IPermission } from "../interfaces/permission-repository.interface";
import { PermissionModel } from "../modals/permission.model";

export class PermissionRepository implements IPermissionRepository {
    private permissionModel = AppDataSource.getRepository(PermissionModel);

    public async getAllPermissionPaginated(
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
                    "permissionId" ILIKE $${params.length + 1} OR
                    "name" ILIKE $${params.length + 1}
                )
            `);
                params.push(`%${searchStr}%`);
            }

            if (whereClauses.length === 0) {
                whereClauses.push("1 = 1");
            }

            const whereSQL = whereClauses.length > 0 ? "WHERE " + whereClauses.join(" AND ") : "";

            const query = `
                SELECT
                    id,
                    "permissionId",
                    name,
                    slug,
                    "isActive",
                    "createdAt",
                    "updatedAt",
                    "inactiveAt",
                    "inactiveBy",
                    "createdBy",
                    "updatedBy"
                FROM
                    rms_tech_solutions_db.public.permission

                ${whereSQL}
                ORDER BY id DESC
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;

            const countQuery = `
               SELECT COUNT(id) AS total
               FROM public.permission
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
            console.error("Error fetching filtered permission data:", error);
            throw new Error("Failed to fetch filtered permission data.");
        }
    }

    public async createPermission(permissionData: any): Promise<PermissionModel> {
        try {
            const newPermission = this.permissionModel.create({
                permissionId: permissionData.permissionId,
                name: permissionData.name,
                slug: permissionData.slug,
                isActive: permissionData.isActive ?? true,
                createdAt: new Date(),
                updatedAt: new Date(),
                inactiveAt: null,
                inactiveBy: null,
                createdBy: permissionData.createdBy ?? null,
                updatedBy: permissionData.updatedBy ?? null,
            });

            return await this.permissionModel.save(newPermission);
        } catch (error) {
            console.error("Error in create Permission:", error);
            throw new Error("Failed to create Permission.");
        }
    }

    public async edit(permissionId: string): Promise<any> {
        try {
            const query = `
              SELECT
                "permissionId",
                name,
                slug,
                "isActive",
                "createdAt",
                "updatedAt"
              FROM
                rms_tech_solutions_db.public.permission
              WHERE
                "permissionId" = $1
              LIMIT 1`;

            const result = await AppDataSource.query(query, [permissionId]);
            return result[0];
        } catch (error) {
            console.error("Error fetching permission record for edit:", error);
            throw new Error("Failed to fetch permission record");
        }
    }

    public async update(permissionId: string, data: IPermission): Promise<any> {
        try {
            const query = `
                UPDATE rms_tech_solutions_db.public.permission
                SET
                    name = $2,
                    slug = $3,
                    "isActive" = $4,
                    "updatedAt" = NOW()
                WHERE
                    "permissionId" = $1
            `;

            const params = [
                permissionId,
                data.name,
                data.slug,
                data.isActive
            ];

            await AppDataSource.query(query, params);
            return { status: true, message: 'Permission record updated successfully' };

        } catch (error) {
            console.error("Error updating Permission data in repository layer:", error);
            throw new Error("Failed to update Permission record");
        }
    }

    public async getByPermission(permissionId: string): Promise<PermissionModel> {
        try {
            const permissionRecord = await this.permissionModel.findOne({ where: { permissionId } });
            return permissionRecord;
        } catch (error) {
            console.error("Error in getByPermissionId:", error);
            throw new Error("Error retrieving user by getByPermissionId");
        }
    }

    public async getBySlug(slug: string): Promise<PermissionModel | null> {
        try {
            return await this.permissionModel.findOne({ where: { slug } });
        } catch (error) {
            console.error("Error in getBySlug:", error);
            throw new Error("Failed to get permission by slug");
        }
    }

}