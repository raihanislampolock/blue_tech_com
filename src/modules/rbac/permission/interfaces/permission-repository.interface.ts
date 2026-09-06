import { PermissionModel } from "../modals/permission.model";

export interface IPermission {
    name: string;
    slug: string;
    isActive: boolean;
    createdBy?: number;
    updatedBy?: number;
}

export interface IPermissionRepository {
    getByPermission(empId: string): Promise<PermissionModel>;
    createPermission(permissionData: IPermission): Promise<PermissionModel>;
    edit(permissionId: string): Promise<any>;
    update(permissionId: string, updateData: Partial<IPermission>): Promise<any>;
    getBySlug(slug: string): Promise<PermissionModel | null>;
    getAllPermissionPaginated(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: any[]; total: number; totalPages: number; currentPage: number }>;
}
