import ExcelJS from "exceljs";
import { Controller } from "../../../core/Controller";
import { HttpRequest, HttpResponse } from "../../../core/Types";
import { IBlueTechCustomer } from "../interfaces/blue_tech_customer_interface";
import { BlueTechCustomerService } from "../services/blue_tech_customer_service";

export class BlueTechCustomerController extends Controller {
    private customerService: BlueTechCustomerService;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.customerService = this.getService("BlueTechCustomerService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-customers", [], this.auth.private, this.index);
        this.onPost("/api/bluetech/bluetech-customers/create", [], this.auth.private, this.create);
        this.onGet("/api/bluetech/bluetech-customers/all", [], this.auth.private, this.getAll);
        this.onGet("/api/bluetech/bluetech-customers/edit/:id", [], this.auth.private, this.edit);
        this.onPut("/api/bluetech/bluetech-customers/update/:id", [], this.auth.private, this.update);
        this.onGet("/api/bluetech/bluetech-customers/export/excel", [], this.auth.private, this.exportExcel);
    }

    public async index(req: HttpRequest, resp: HttpResponse) {
        return resp.view("bluetech/bluetech-customers/index");
    }

    public async create(req: HttpRequest, resp: HttpResponse) {
        try {
            const result = await this.customerService.create({
                customerName: req.body.customerName,
                phoneNumber: req.body.phoneNumber,
                email: req.body.email,
                taxNumber: req.body.taxNumber,
                billingAddress: req.body.billingAddress,
                notes: req.body.notes,
                isActive: req.body.isActive !== "false",
                createdBy: req.user?.userId || "system"
            });
            return resp.status(201).json({ status: true, message: "Customer created successfully", data: result });
        } catch (error: any) {
            return resp.status(400).json({ status: false, message: error.message });
        }
    }

    public async getAll(req: HttpRequest, resp: HttpResponse) {
        try {
            const page = Math.max(Number(req.query.page) || 1, 1);
            const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
            const result = await this.customerService.getAll(String(req.query.search || "").trim(), page, limit);
            return resp.json({ status: true, ...result });
        } catch (error: any) {
            return resp.status(500).json({ status: false, message: error.message });
        }
    }

    public async edit(req: HttpRequest, resp: HttpResponse) {
        try {
            const id = Number(req.params.id);
            if (!id) return resp.status(400).json({ status: false, message: "Invalid customer ID" });
            return resp.json({ status: true, data: await this.customerService.edit(id) });
        } catch (error: any) {
            return resp.status(404).json({ status: false, message: error.message });
        }
    }

    public async update(req: HttpRequest, resp: HttpResponse) {
        try {
            const id = Number(req.params.id);
            if (!id) return resp.status(400).json({ status: false, message: "Invalid customer ID" });
            const result = await this.customerService.update(id, {
                customerName: req.body.customerName,
                phoneNumber: req.body.phoneNumber,
                email: req.body.email,
                taxNumber: req.body.taxNumber,
                billingAddress: req.body.billingAddress,
                notes: req.body.notes,
                isActive: req.body.isActive !== "false",
                updatedBy: req.user?.userId || "system"
            });
            return resp.json({ status: true, message: "Customer updated successfully", data: result });
        } catch (error: any) {
            return resp.status(400).json({ status: false, message: error.message });
        }
    }

    public async exportExcel(req: HttpRequest, resp: HttpResponse) {
        try {
            const result = await this.customerService.getAll(String(req.query.search || "").trim(), 1, 1000000);
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Blue Tech Customers");
            worksheet.columns = [
                { header: "Customer Name", key: "customerName", width: 28 },
                { header: "Phone", key: "phoneNumber", width: 20 },
                { header: "Email", key: "email", width: 30 },
                { header: "Tax Number", key: "taxNumber", width: 20 },
                { header: "Billing Address", key: "billingAddress", width: 40 },
                { header: "Notes", key: "notes", width: 35 },
                { header: "Active", key: "isActive", width: 12 },
                { header: "Created By", key: "createdBy", width: 16 },
                { header: "Created At", key: "created_at", width: 22 }
            ];
            result.data.forEach((row: IBlueTechCustomer) => worksheet.addRow(row));
            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "580DB4" } };
            });
            resp.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            resp.setHeader("Content-Disposition", `attachment; filename=blue_tech_customers_${Date.now()}.xlsx`);
            return resp.send(await workbook.xlsx.writeBuffer());
        } catch (error: any) {
            return resp.status(500).json({ status: false, message: error.message });
        }
    }
}
