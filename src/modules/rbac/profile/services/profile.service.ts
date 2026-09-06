// src/modules/rbac/profile/services/profile.service.ts
import { IProfileRepository } from "../interfaces/profile.interface";
import { Config } from "../../../../core/Config";
import fs from "fs";
import { UserModel } from "../../user/models/user.model";
import { DataSource } from "typeorm";

const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class ProfileService {
    private profileRepository: IProfileRepository;
    private dataSource: DataSource;

    constructor(profileRepository: IProfileRepository, dataSource: DataSource) {
        this.profileRepository = profileRepository;
        this.dataSource = dataSource;
    }

    public async getByEmpId(empId: string): Promise<UserModel | null> {
        try {
            return await this.profileRepository.getByEmpId(empId);
        } catch (error) {
            console.error("Error in getByEmpId service:", error);
            return null;
        }
    }

    public async createUser(userData: any): Promise<any> {
        try {
            const result = await this.profileRepository.createUser(userData);
            return result;
        } catch (error) {
            console.error("Error in createUser service:", error);
            throw new Error("Failed to create User record");
        }
    }

    public async getAllUsersWithRoles(
        empId: string,
        searchStr: string,
        page: number = 1,
        limit: number = 10
    ): Promise<{ data: any[]; total: number; totalPages: number; currentPage: number }> {
        try {
            const result = await this.profileRepository.getAllUsersWithRolesPaginated(
                empId,
                searchStr,
                page,
                limit
            );

            const totalPages = Math.ceil(result.total / limit) || 0;
            const currentPage = page;

            // Make sure all 4 properties are returned
            return {
                data: result.data,
                total: result.total,
                totalPages,
                currentPage,
            };
        } catch (error) {
            console.error("Error fetching user data in service:", error);
            throw new Error("Error fetching user data");
        }
    }


    public async edit(userId: string): Promise<any> {
        try {
            const userRecord = await this.profileRepository.edit(userId);

            if (!userRecord) {
                throw new Error(`No user record found for userId: ${userId}`);
            }

            return userRecord;
        } catch (error) {
            console.error("Error fetching user data in service layer:", error);
            throw new Error("Error fetching user data");
        }
    }

    public async update(userId: string, updateData: any): Promise<any> {
        try {
            // Ensure password never updated here
            if ('password' in updateData) {
                delete updateData.password;
            }

            const updatedRecord = await this.profileRepository.update(userId, updateData);

            if (!updatedRecord) {
                throw new Error(`Failed to update user record with userId: ${userId}`);
            }

            return updatedRecord;
        } catch (error) {
            console.error("Error updating user data in service layer:", error);
            throw new Error("Error updating user data");
        }
    }

    public async updatePassword(userId: string, newPassword: string): Promise<void> {
        await this.profileRepository.updatePassword(userId, newPassword);
    }

    public async getById(userId: string): Promise<UserModel | null> {
        return await this.profileRepository.getById(userId);
    }
}
