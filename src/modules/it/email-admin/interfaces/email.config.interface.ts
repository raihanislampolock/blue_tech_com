import { Timestamp } from "typeorm";

export interface IEmailConfig {
    id: number;
    type: string;
    email: string | null;
    appPassword: boolean | null;
    isActive: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    createdBy: string | null;
    updatedBy: string | null;
}

export interface IEmailConfigRepository {
    create(pipedriveData: IEmailConfig): Promise<any>;
    edit(id: number): Promise<any>;
    update(id: number, updateData: Partial<IEmailConfig>): Promise<any>;
    getAll(searchStr: string, page: number, limit: number): Promise<{ data: any; total: number }>;
}
