import { AppDataSource } from "../../../../init";
import { OtpModel } from "../models/otp.model";
import { IUserRepository, IUser } from "../interfaces/user-repository.interface";
import { UserModel } from "../models/user.model";
import { QueryRunner } from "typeorm";
import { ProviderModel } from "../models/provider.model";

export class UserRepository implements IUserRepository {
    private userModel = AppDataSource.getRepository(UserModel); // Use AppDataSource
    private providerModel = AppDataSource.getRepository(ProviderModel); // Use AppDataSource

    public async getByEmpId(empId: string): Promise<UserModel | null> {
        return await this.userModel.findOne({ where: { empId } });
    }

    public async createUser(userData: any): Promise<UserModel> {
        try {
            const newUser = this.userModel.create({
                userId: userData.userId,
                username: userData.username,
                empId: userData.empId,
                password: userData.password,
                roleId: userData.roleId.toString(),
                gender: userData.gender ?? null,
                dateOfBirth: userData.dateOfBirth ?? null,
                email: userData.email ?? null,
                phone: userData.phone,
                address: userData.address ?? null,
                files: userData.files ?? null,
                isActive: userData.isActive ?? true,
                createdAt: new Date(),
                updatedAt: new Date(),
                inactiveAt: null,
                inactiveBy: null,
                createdBy: userData.createdBy ?? null,
                updatedBy: userData.updatedBy ?? null,
            });

            return await this.userModel.save(newUser);
        } catch (error) {
            console.error("Error in createUser:", error);
            throw new Error("Failed to create user.");
        }
    }


    // public async createProvider(providerData: Partial<ProviderModel[]>, queryRunner: QueryRunner = null): Promise<ProviderModel[]> {
    //     try {
    //         const providerModel = queryRunner ? queryRunner.manager.getRepository(ProviderModel) : this.providerModel;
    //         const newProvider = providerModel.create(providerData);
    //         return await providerModel.save(newProvider);
    //     } catch (error) {
    //         console.error("Error in create:", error);
    //         throw new Error("Error creating provider service");
    //     }
    // }

    public async getUserWithRole(empId: string): Promise<any> {
        try {
            const query = `
                SELECT
                    u.emp_id AS "empId",
                    u.name AS "userName",
                    u.email AS "email",
                    r.name AS "roleName",
                    r.description AS "roleDescription"
                FROM
                    user_model u
                LEFT JOIN
                    role_model r ON u.role_id = r.id
                WHERE
                    u.emp_id = $1
            `;

            const result = await AppDataSource.query(query, [empId]);
            return result;
        } catch (error) {
            console.error("Error in getUserWithRole:", error);
            throw new Error("Error fetching user with role");
        }
    }


    public async getAllUsersWithRolesPaginated(
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
                    u."empId" ILIKE $${params.length + 1} OR
                    u."username" ILIKE $${params.length + 1}
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
                    u.id,
                    u."userId",
                    u."empId",
                    u.username,
                    CASE
                      WHEN u.gender = 'M' THEN 'Male'
                      WHEN u.gender = 'F' THEN 'Female'
                      WHEN u.gender = 'O' THEN 'Other'
                      ELSE 'Unknown'
                    END AS gender,
                    u."dateOfBirth",
                    u.email,
                    u.phone,
                    u.address,
                    u.files,
                    r."name" AS role_name,
                    u."isActive",
                    u."createdAt",
                    u."updatedAt"
                FROM
                    rms_tech_solutions_db.public.users u
                LEFT JOIN
                    roles r ON u."roleId" = r."roleId"

                ${whereSQL}
                ORDER BY u.id DESC
                LIMIT $${params.length + 1} OFFSET $${params.length + 2}
            `;

            const countQuery = `
               SELECT COUNT(u.id) AS total
               FROM public.users u
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
            console.error("Error fetching filtered user data:", error);
            throw new Error("Failed to fetch filtered user data.");
        }
    }

    public async edit(userId: string): Promise<any> {
        try {
            const query = `
              SELECT
                u."userId",
                u."empId",
                u.username,
                u.gender,
                u."dateOfBirth",
                u.email,
                u.phone,
                u.address,
                u.files,
                r."name" AS role_name,
                u."roleId",
                u."isActive",
                u."createdAt",
                u."updatedAt"
              FROM
                rms_tech_solutions_db.public.users u
              LEFT JOIN
                roles r ON u."roleId" = r."roleId"
              WHERE
                u."userId" = $1
              LIMIT 1`;

            const result = await AppDataSource.query(query, [userId]);
            return result[0];
        } catch (error) {
            console.error("Error fetching User record for edit:", error);
            throw new Error("Failed to fetch User record");
        }
    }


    public async update(userId: string, data: IUser): Promise<any> {
        try {
            const query = `
                UPDATE rms_tech_solutions_db.public.users
                SET
                    "empId" = $2,
                    username = $3,
                    gender = $4,
                    "dateOfBirth" = $5,
                    email = $6,
                    phone = $7,
                    address = $8,
                    files = $9,
                    "roleId" = $10,
                    "isActive" = $11,
                    "updatedAt" = NOW()
                WHERE
                    "userId" = $1
            `;

            const params = [
                userId,
                data.empId,
                data.username,
                data.gender,
                data.dateOfBirth,
                data.email,
                data.phone,
                data.address,
                data.files,
                data.roleId,
                data.isActive
            ];

            await AppDataSource.query(query, params);
            return { status: true, message: 'User record updated successfully' };

        } catch (error) {
            console.error("Error updating user data in repository layer:", error);
            throw new Error("Failed to update user record");
        }
    }

    public async updatePassword(userId: string, newPassword: string): Promise<void> {
        await AppDataSource.query(
            `UPDATE rms_tech_solutions_db.public.users SET password = $1, "updatedAt" = NOW() WHERE "userId" = $2`,
            [newPassword, userId]
        );
    }

    public async getById(userId: string): Promise<UserModel | null> {
        return await this.userModel.findOne({
            where: { userId },
        });
    }
}