import { BlueTechItemsModel } from "../models/blue_tech_item_model";

export interface IBlueTechItems {
    id: number;
    itemType: string;
    manufactureOrigin: string;
    itemName: string;
    itemPrice: string;
    itemConfigurations?: string;
    imeiNumber?: string;
    createdBy?: string;
    updatedBy?: string;
    created_at: Date;
    updated_at: Date;
}

export interface IBlueTechItemsRepository {
    create(blueTechItemsData: IBlueTechItems): Promise<BlueTechItemsModel>;

    getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<{ data: IBlueTechItems[]; total: number }>;

    edit(id: number): Promise<IBlueTechItems | null>;
    update(id: number, updateData: Partial<IBlueTechItems>): Promise<any>;
}
