import { IPermissionRepository } from "../interfaces/permission-repository.interface";
import { Config } from "../../../../core/Config";
import fs from "fs";
const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));
import { DataSource } from "typeorm";
import { PermissionModel } from "../modals/permission.model";

export class PermissionService {
    private permissionRepository: IPermissionRepository;
    private dataSource: DataSource;

    constructor(permissionRepository: IPermissionRepository, dataSource: DataSource) {
        this.permissionRepository = permissionRepository;
        this.dataSource = dataSource;
    }

    public async getAllPermission(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<any> {
        try {
            return await this.permissionRepository.getAllPermissionPaginated(searchStr, page, limit);
        } catch (error) {
            console.error("Error fetching permission data:", error);
            throw new Error("Error fetching permission data");
        }
    }

    public async createPermission(permissionData: any): Promise<any> {
        try {
            const result = await this.permissionRepository.createPermission(permissionData);
            return result;
        } catch (error) {
            console.error("Error in create in Permission Service:", error);
            throw new Error("Failed to create Permission record");
        }
    }

    public async edit(permissionId: string): Promise<any> {
        try {
            const permissionRecord = await this.permissionRepository.edit(permissionId);

            if (!permissionRecord) {
                throw new Error(`No user record found for permissionId: ${permissionId}`);
            }

            return permissionRecord;
        } catch (error) {
            console.error("Error fetching permission data in service layer:", error);
            throw new Error("Error fetching permission data");
        }
    }

    public async update(permissionId: string, updateData: any): Promise<any> {
        try {

            const updatedRecord = await this.permissionRepository.update(permissionId, updateData);

            if (!updatedRecord) {
                throw new Error(`Failed to update user record with userId: ${permissionId}`);
            }

            return updatedRecord;
        } catch (error) {
            console.error("Error updating permission data in service layer:", error);
            throw new Error("Error updating permission data");
        }
    }

    public async getByPermissionId(permissionId: string): Promise<PermissionModel> {
        try {
            return await this.permissionRepository.getByPermission(permissionId);
        } catch (error) {
            return null;
        }
    }

    public async getBySlug(slug: string): Promise<PermissionModel | null> {
        try {
            return await this.permissionRepository.getBySlug(slug);
        } catch (error) {
            console.error("Error fetching permission by slug in service layer:", error);
            throw new Error("Failed to fetch permission by slug");
        }
    }
}