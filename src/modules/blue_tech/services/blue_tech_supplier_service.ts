import { Config } from "../../../core/Config";
import fs from "fs";
import { IBlueTechSupplierRepository } from "../interfaces/blue_tech_supplier_interface";


const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class BlueTechSupplierService {
    private blueTechSupplierRepository: IBlueTechSupplierRepository;

    constructor(blueTechSupplierRepository: IBlueTechSupplierRepository) {
        this.blueTechSupplierRepository = blueTechSupplierRepository;
    }

    public async create(blueTechSupplierData: any): Promise<any> {
        try {
            const result = await this.blueTechSupplierRepository.create(blueTechSupplierData);
            return result;
        } catch (error) {
            console.error("Error in create in Blue Tech Supplier Service:", error);
            throw new Error("Failed to create Blue Tech Supplier record");
        }
    }

    public async getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<any> {
        try {
            return await this.blueTechSupplierRepository.getAll(searchStr, page, limit);
        } catch (error) {
            console.error("Error fetching Blue Tech Supplier data:", error);
            throw new Error("Error fetching Blue Tech Supplier data");
        }
    }

    public async edit(id: number): Promise<any> {
        try {
            const blueTechSupplierRecord = await this.blueTechSupplierRepository.edit(id);

            if (!blueTechSupplierRecord) {
                throw new Error(`No Supplier record found for supplierId: ${id}`);
            }

            return blueTechSupplierRecord;
        } catch (error) {
            console.error("Error fetching Blue Tech Supplier data in service layer:", error);
            throw new Error("Error fetching Blue Tech Supplier data");
        }
    }

    public async update(id: number, updateData: any): Promise<any> {
        try {
            const updatedRecord = await this.blueTechSupplierRepository.update(id, updateData);

            if (!updatedRecord) {
                throw new Error(`Failed to update blue tech supplier record with ID: ${id}`);
            }

            return updatedRecord;
        } catch (error) {
            console.error("Error updating blue tech supplier data in service layer:", error);
            throw new Error("Error updating blue tech supplier data");
        }
    }

}
