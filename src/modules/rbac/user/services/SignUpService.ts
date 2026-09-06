import { IUserRepository } from "../interfaces/user-repository.interface";
import jwt from 'jsonwebtoken';
import { Config } from "../../../../core/Config";
import fs from "fs";
const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));
import axios from 'axios';
import { UserModel } from "../models/user.model";
import { DataSource } from "typeorm";
import { ProviderModel } from "../models/provider.model";

export class SignUpService {
    private userRepository: IUserRepository;
    private dataSource: DataSource;

    constructor(userRepository: IUserRepository, dataSource: DataSource) {
        this.userRepository = userRepository;
        this.dataSource = dataSource;
    }

    public async getByEmpId(empId: string): Promise<UserModel | null> {
        return await this.userRepository.getByEmpId(empId);
    }

    public async createUser(userData: any): Promise<any> {
        try {
            const result = await this.userRepository.createUser(userData);
            return result;
        } catch (error) {
            console.error("Error in create in UserService:", error);
            throw new Error("Failed to create User record");
        }
    }

    public async getAllUsersWithRoles(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<any> {
        try {
            return await this.userRepository.getAllUsersWithRolesPaginated(searchStr, page, limit);
        } catch (error) {
            console.error("Error fetching user data:", error);
            throw new Error("Error fetching user data");
        }
    }

    public async edit(userId: string): Promise<any> {
        try {
            const userRecord = await this.userRepository.edit(userId);

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
            if ('password' in updateData) {
                delete updateData.password;
            }

            const updatedRecord = await this.userRepository.update(userId, updateData);

            if (!updatedRecord) {
                throw new Error(`Failed to update user record with userId: ${userId}`);
            }

            return updatedRecord;
        } catch (error) {
            console.error("Error updating user data in service layer:", error);
            throw new Error("Error updating user data");
        }
    }


    private formatDateToYMD(inputDate: string): string | null {
      if (!inputDate) return null;

      // Handle mm-dd-yyyy or mm/dd/yyyy
      const parts = inputDate.includes('-') ? inputDate.split('-') : inputDate.split('/');
      if (parts.length !== 3) return null;

      const [mm, dd, yyyy] = parts;
      return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`; // → yyyy-MM-dd
    }

    public async updatePassword(userId: string, newPassword: string): Promise<void> {
        await this.userRepository.updatePassword(userId, newPassword);
    }


    public async getById(userId: string): Promise<UserModel | null> {
        return await this.userRepository.getById(userId);
    }

}
