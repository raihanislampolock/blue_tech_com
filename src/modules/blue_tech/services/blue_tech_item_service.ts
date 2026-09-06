import { Config } from "../../../core/Config";
import fs from "fs";
import { IBlueTechItemsRepository } from "../interfaces/blue_tech_item_interface";


const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class BlueTechItemsService {
    private blueTechItemsRepository: IBlueTechItemsRepository;

    constructor(blueTechItemsRepository: IBlueTechItemsRepository) {
        this.blueTechItemsRepository = blueTechItemsRepository;
    }

    public async create(blueTechItemsData: any): Promise<any> {
        try {
            const result = await this.blueTechItemsRepository.create(blueTechItemsData);
            return result;
        } catch (error) {
            console.error("Error in create in Blue Tech Items Service:", error);
            throw new Error("Failed to create Blue Tech Items record");
        }
    }

    public async getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<any> {
        try {
            return await this.blueTechItemsRepository.getAll(searchStr, page, limit);
        } catch (error) {
            console.error("Error fetching Blue Tech Items data:", error);
            throw new Error("Error fetching Blue Tech Items data");
        }
    }

    public async edit(id: number): Promise<any> {
        try {
            const blueTechItemsRecord = await this.blueTechItemsRepository.edit(id);

            if (!blueTechItemsRecord) {
                throw new Error(`No Item record found for itemId: ${id}`);
            }

            return blueTechItemsRecord;
        } catch (error) {
            console.error("Error fetching Blue Tech Items data in service layer:", error);
            throw new Error("Error fetching Blue Tech Items data");
        }
    }

    public async update(id: number, updateData: any): Promise<any> {
        try {
            const updatedRecord = await this.blueTechItemsRepository.update(id, updateData);

            if (!updatedRecord) {
                throw new Error(`Failed to update blue tech items record with ID: ${id}`);
            }

            return updatedRecord;
        } catch (error) {
            console.error("Error updating blue tech items data in service layer:", error);
            throw new Error("Error updating blue tech items data");
        }
    }

}
