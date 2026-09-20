import { Controller } from "../../../core/Controller";
import { HttpRequest, HttpResponse } from "../../../core/Types";
import { BlueTechInventoryFlowReportService } from "../services/blue_tech_inventory_flow_report_service";

export class BlueTechInventoryFlowReportController extends Controller {
    private service: BlueTechInventoryFlowReportService;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.service = this.getService("BlueTechInventoryFlowReportService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-inventory-flow-report", [], this.auth.private, this.index);
        this.onGet("/api/bluetech/inventory-flow-report", [], this.auth.private, this.getReport);
    }

    public async index(req: HttpRequest, resp: HttpResponse) {
        return resp.view("bluetech/bluetech-inventory-flow-report/index");
    }

    public async getReport(req: HttpRequest, resp: HttpResponse) {
        try {
            const requestedYear = Number(req.query.year);
            const year = Number.isInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
                ? requestedYear
                : new Date().getFullYear();
            return resp.json({ status: true, data: await this.service.getReport(year) });
        } catch (error: any) {
            return resp.status(500).json({ status: false, message: error.message });
        }
    }
}