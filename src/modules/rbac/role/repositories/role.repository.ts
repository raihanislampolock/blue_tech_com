import { AppDataSource } from "../../../../init";
import { IRole, IRoleRepository } from "../interfaces/role.interface";
import { RoleModel } from "../models/role.model";

export class RoleRepository implements IRoleRepository {
    private roleModel = AppDataSource.getRepository(RoleModel);

    public async getByName(name: string): Promise<RoleModel> {
        try {
            const roleRecord = await this.roleModel.findOne({ where: { name } });
            return roleRecord;
        } catch (error) {
            console.error("Error in getByName:", error);
            throw new Error("Error retrieving role by name");
        }
    }

    public async create(roleData: Partial<RoleModel>): Promise<RoleModel> {
        try {
            const newRole = this.roleModel.create({
                roleId: roleData.roleId,
                name: roleData.name,
                slug: roleData.slug,
                description: roleData.description,
                status: roleData.status ?? true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return await this.roleModel.save(newRole);
        } catch (error) {
            console.error("Error in roleUser:", error);
            throw new Error("Failed to role user.");
        }
    }

    public async getAll(): Promise<RoleModel[]> {
        try {
            const roles = await this.roleModel.find({ where: { status: true } });
            return roles;
        } catch (error) {
            console.error("Error in getAll:", error);
            throw new Error("Error retrieving all roles");
        }
    }

    public async getAllRolesPaginated(
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
                        r."name" ILIKE $${params.length + 1} OR
                        r."description" ILIKE $${params.length + 1}
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
                r.id,
                r."roleId",
                r."name",
                r.description,
                r.status,
                r."createdAt",
                r."updatedAt"
                from public.roles r
                ${whereSQL}
                ORDER BY r."createdAt" DESC
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;

            const countQuery = `
               SELECT COUNT(r.id) AS total
               FROM public.roles as r
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
            console.error("Error fetching filtered role data:", error);
            throw new Error("Failed to fetch filtered role data.");
        }
    }

    public async edit(roleId: string): Promise<any> {
        try {
            const query = `
                select
                r."roleId",
                r."name",
                r.description,
                r.status,
                r."createdAt",
                r."updatedAt"
            from rms_tech_solutions_db.public.roles r
            WHERE
                r."roleId" = $1
            LIMIT 1`;

            const result = await AppDataSource.query(query, [roleId]);
            return result[0];
        } catch (error) {
            console.error("Error fetching Role record for edit:", error);
            throw new Error("Failed to fetch Role record");
        }
    }

    public async update(roleId: string, data: IRole): Promise<any> {
        try {
            const query = `
                UPDATE rms_tech_solutions_db.public.roles
                SET
                    "name" = $2,
                    description = $3,
                    status = $4,
                    "updatedAt" = NOW()
                WHERE
                    "roleId" = $1
            `;

            const params = [
                roleId,
                data.name,
                data.description,
                data.status
            ];

            await AppDataSource.query(query, params);
            return { status: true, message: 'Role record updated successfully' };

        } catch (error) {
            console.error("Error updating role data in repository layer:", error);
            throw new Error("Failed to update role record");
        }
    }

    public async getAllRoles(): Promise<{ "roleId" : string; name: string }[]> {
        try {
            const query = `
                SELECT
                    r."roleId" ,
                    r."name"
                FROM rms_tech_solutions_db.public.roles r
                ORDER BY r."createdAt" DESC
            `;
            const roles = await AppDataSource.query(query);
            return roles;
        } catch (error) {
            console.error("Error fetching roles:", error);
            throw new Error("Error fetching roles");
        }
    }

    public async getById(roleId: string): Promise<RoleModel | null> {
        try {
            const roleRecord = await this.roleModel.findOne({ where: { roleId } });
            return roleRecord;
        } catch (error) {
            console.error("Error in getById:", error);
            throw new Error("Error retrieving role by ID");
        }
    }
}
