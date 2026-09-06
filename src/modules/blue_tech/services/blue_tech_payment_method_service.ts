import { Config } from "../../../core/Config";
import fs from "fs";
import { IBlueTechPaymentMethodRepository } from "../interfaces/blue_tech_payment_method_interface";


const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class BlueTechPaymentMethodService {
    private blueTechPaymentMethodRepository: IBlueTechPaymentMethodRepository;

    constructor(blueTechPaymentMethodRepository: IBlueTechPaymentMethodRepository) {
        this.blueTechPaymentMethodRepository = blueTechPaymentMethodRepository;
    }

    public async create(blueTechPaymentMethodData: any): Promise<any> {
        try {
            const result = await this.blueTechPaymentMethodRepository.create(blueTechPaymentMethodData);
            return result;
        } catch (error) {
            console.error("Error in create in Blue Tech Payment Method Service:", error);
            throw new Error("Failed to create Blue Tech Payment Method record");
        }
    }

    public async getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<any> {
        try {
            return await this.blueTechPaymentMethodRepository.getAll(searchStr, page, limit);
        } catch (error) {
            console.error("Error fetching Blue Tech Payment Method data:", error);
            throw new Error("Error fetching Blue Tech Payment Method data");
        }
    }

    public async edit(id: number): Promise<any> {
        try {
            const blueTechPaymentMethodRecord = await this.blueTechPaymentMethodRepository.edit(id);

            if (!blueTechPaymentMethodRecord) {
                throw new Error(`No Payment Method record found for paymentMethodId: ${id}`);
            }

            return blueTechPaymentMethodRecord;
        } catch (error) {
            console.error("Error fetching Blue Tech Payment Method data in service layer:", error);
            throw new Error("Error fetching Blue Tech Payment Method data");
        }
    }

    public async update(id: number, updateData: any): Promise<any> {
        try {
            const updatedRecord = await this.blueTechPaymentMethodRepository.update(id, updateData);

            if (!updatedRecord) {
                throw new Error(`Failed to update blue tech payment method record with ID: ${id}`);
            }

            return updatedRecord;
        } catch (error) {
            console.error("Error updating blue tech payment method data in service layer:", error);
            throw new Error("Error updating blue tech payment method data");
        }
    }

}
