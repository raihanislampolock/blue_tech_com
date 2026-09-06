import { QueryRunner } from "typeorm";
import { UserModel } from "../models/user.model";
import { ProviderModel } from "../models/provider.model";

export interface IUser {
    empId: string;
    username: string;
    password: string;      // Add this
    gender: 'M' | 'F' | 'O' | string;
    dateOfBirth: Date | null;
    email: string | null;
    phone: string;
    address: string | null;
    files: string | null;
    roleId: number;
    isActive: boolean;
    createdBy?: number;
    updatedBy?: number;
}

export interface IUserRepository {
    getByEmpId(empId: string): Promise<UserModel | null>;
    // getDataByEmpId(empId: string): Promise<any>;
    createUser(userData: IUser): Promise<UserModel>;
    edit(userId: string): Promise<any>;
    update(userId: string, updateData: Partial<IUser>): Promise<any>;
    // createProvider(providerData: Partial<ProviderModel[]>, queryRunner: QueryRunner | null): Promise<ProviderModel[]>;
    getAllUsersWithRolesPaginated(searchStr: string, page: number, limit: number): Promise<{ data: any; total: number }>;
    updatePassword(userId: string, hashedNewPassword: string): Promise<void>;
    getById(userId: string): Promise<UserModel | null>;
}
