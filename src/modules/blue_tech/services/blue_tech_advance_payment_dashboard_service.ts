import { Config } from "../../../core/Config";
import fs from "fs";
import { IBlueTechAdvancePaymentRepository } from "../interfaces/blue_tech_advance_payment_dashboard_interface";


const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class BlueTechAdvancePaymentService {
    private blueTechAdvancePaymentRepository: IBlueTechAdvancePaymentRepository;

    constructor(blueTechAdvancePaymentRepository: IBlueTechAdvancePaymentRepository) {
        this.blueTechAdvancePaymentRepository = blueTechAdvancePaymentRepository;
    }

    public async getAll(
        searchStr: string,
        page: number,
        limit: number
    ): Promise<any> {
        try {
            return await this.blueTechAdvancePaymentRepository.getAll(searchStr, page, limit);
        } catch (error) {
            console.error("Error fetching Blue Tech Advance Payments data:", error);
            throw new Error("Error fetching Blue Tech Advance Payments data");
        }
    }

}