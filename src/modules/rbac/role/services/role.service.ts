import { Config } from "../../../../core/Config";
import fs from "fs";
import { IRoleRepository } from "../interfaces/role.interface";
import { RoleModel } from "../models/role.model";

const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class RoleService {
    private roleRepository: IRoleRepository;

    constructor(roleRepository: IRoleRepository) {
        this.roleRepository = roleRepository;
    }

    public async getByName(name: string): Promise<RoleModel> {
        try {
            return await this.roleRepository.getByName(name);
        } catch (error) {
            return null;
        }
    }

    public async createRole(roleData: any): Promise<any> {
        try {
            const result = await this.roleRepository.create(roleData);
            return result;
        } catch (error) {
            console.error("Error in create in Role Service:", error);
            throw new Error("Failed to create Role record");
        }
    }

    public async getAllRoles(): Promise<RoleModel[]> {
        try {
            return await this.roleRepository.getAll();
        } catch (error) {
            console.error("Error fetching all roles:", error.message);
            throw new Error(error.message);
        }
    }

    public async getAllRolesData(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<any> {
        try {
            return await this.roleRepository.getAllRolesPaginated(searchStr, page, limit);
        } catch (error) {
            console.error("Error fetching role data:", error);
            throw new Error("Error fetching role data");
        }
    }

    public async edit(roleId: string): Promise<any> {
        try {
            const roleRecord = await this.roleRepository.edit(roleId);

            if (!roleRecord) {
                throw new Error(`No role record found for roleId: ${roleId}`);
            }

            return roleRecord;
        } catch (error) {
            console.error("Error fetching role data in service layer:", error);
            throw new Error("Error fetching role data");
        }
    }

    public async update(roleId: string, updateData: any): Promise<any> {
        try {
            const updatedRecord = await this.roleRepository.update(roleId, updateData);

            if (!updatedRecord) {
                throw new Error(`Failed to update role record with ID: ${roleId}`);
            }

            return updatedRecord;
        } catch (error) {
            console.error("Error updating role data in service layer:", error);
            throw new Error("Error updating role data");
        }
    }

}
