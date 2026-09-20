import { Config } from "../../../core/Config";
import fs from "fs";
import { IBlueTechCustomerAdvancePaymentRepository } from "../interfaces/blue_tech_customer_advance_payment_interface";


const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class BlueTechCustomerAdvancePaymentService {
    private blueTechCustomerAdvancePaymentRepository: IBlueTechCustomerAdvancePaymentRepository;

    constructor(blueTechCustomerAdvancePaymentRepository: IBlueTechCustomerAdvancePaymentRepository) {
        this.blueTechCustomerAdvancePaymentRepository = blueTechCustomerAdvancePaymentRepository;
    }

    public async getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<any> {
        try {
            return await this.blueTechCustomerAdvancePaymentRepository.getAll(searchStr, page, limit);
        } catch (error) {
            console.error("Error fetching Blue Tech Customer Advance Payments data:", error);
            throw new Error("Error fetching Blue Tech Customer Advance Payments data");
        }
    }

}