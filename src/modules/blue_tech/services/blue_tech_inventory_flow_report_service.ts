import { IBlueTechInventoryFlowReportRepository } from "../interfaces/blue_tech_inventory_flow_report_interface";

export class BlueTechInventoryFlowReportService {
    constructor(private repository: IBlueTechInventoryFlowReportRepository) {}

    public async getReport(year: number): Promise<any> {
        return this.repository.getReport(year);
    }
}