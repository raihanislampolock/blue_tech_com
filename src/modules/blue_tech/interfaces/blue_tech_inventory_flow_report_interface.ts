export interface IBlueTechInventoryFlowReportRepository {
    getReport(year: number): Promise<{
        year: number;
        monthly: any[];
        itemSummary: any[];
    }>;
}