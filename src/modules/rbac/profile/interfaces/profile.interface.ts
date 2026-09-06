import { QueryRunner } from "typeorm";
import { UserModel } from "../../user/models/user.model";
import { ProviderModel } from "../../user/models/provider.model";

export interface IProfile {
    empId: string;
    username: string;
    password: string;      // Add this
    gender: 'M' | 'F' | 'O' | string;
    dateOfBirth: Date | null;
    email: string | null;
    phone: string;
    address: string | null;
    roleId: number;
    isActive: boolean;
    createdBy?: number;
    updatedBy?: number;
}

export interface IProfileRepository {
    getByEmpId(empId: string): Promise<UserModel | null>;

    createUser(userData: IProfile): Promise<UserModel>;

    edit(userId: string): Promise<any>;

    update(userId: string, updateData: Partial<IProfile>): Promise<any>;

    getAllUsersWithRolesPaginated(
        empId: string,
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: any; total: number }>;

    updatePassword(userId: string, hashedNewPassword: string): Promise<void>;

    getById(userId: string): Promise<UserModel | null>;
}
