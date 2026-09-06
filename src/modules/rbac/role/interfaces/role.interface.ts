import { RoleModel } from "../models/role.model";

export interface IRole {
    roleId: string;
    name: string;
    slug: string;
    description: string;
    status: boolean;
    createdBy?: number;
    updatedBy?: number;
}

export interface IRoleRepository {
    getByName(name: string): Promise<RoleModel>;
    getAll(): Promise<RoleModel[]>;
    getAllRoles(): Promise<{ "roleId" : string; name: string }[]>;
    create(userData: IRole): Promise<RoleModel>;
    edit(roleId: string): Promise<any>;
    update(roleId: string, updateData: Partial<IRole>): Promise<any>;
    getAllRolesPaginated(searchStr: string, page: number, limit: number): Promise<{ data: any; total: number }>;
}
