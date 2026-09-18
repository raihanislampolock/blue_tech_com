import multer from "multer";
import { Controller } from "../../../core/Controller";
import { HttpRequest, HttpResponse } from "../../../core/Types";
import { BlueTechInvoiceService } from "../services/blue_tech_invoice_service";

export class BlueTechInvoiceController extends Controller {
    private service: BlueTechInvoiceService;
    private formDataParser = multer().none();
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.service = this.getService("BlueTechInvoiceService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-invoices", [], this.auth.private, this.index);
        this.onPost("/api/bluetech/invoices/create", [this.formDataParser], this.auth.private, this.create);
        this.onGet("/api/bluetech/invoices/all", [], this.auth.private, this.getAll);
        this.onGet("/api/bluetech/invoices/edit/:id", [], this.auth.private, this.edit);
        this.onPut("/api/bluetech/invoices/update/:id", [this.formDataParser], this.auth.private, this.update);
        this.onGet("/api/bluetech/invoices/generate-number", [], this.auth.private, this.generateNumber);
        this.onPost("/api/bluetech/customer-advances", [this.formDataParser], this.auth.private, this.recordAdvance);
        this.onGet("/api/bluetech/customer-advances/balance/:customerId", [], this.auth.private, this.advanceBalance);
        this.onGet("/api/bluetech/invoices/generate-pdf/:id", [], this.auth.private, this.generatePdf);
        this.onGet("/api/bluetech/invoices/view-pdf/:id", [], this.auth.private, this.viewPdf);
    }

    public async index(req: HttpRequest, resp: HttpResponse) {
        try {
            return resp.view("bluetech/bluetech-invoices/index", {
                items: await this.service.getItemDropdown(),
                customers: await this.service.getCustomerDropdown(),
                paymentMethods: await this.service.getPaymentMethodDropdown()
            });
        } catch (error) {
            return resp.view("bluetech/bluetech-invoices/index", { items: [], customers: [], paymentMethods: [] });
        }
    }

    public async create(req: HttpRequest, resp: HttpResponse) {
        try {
            const body = req.body;
            const items = typeof body.items === "string" ? JSON.parse(body.items) : body.items;
            const result = await this.service.create({ ...body, customerId: Number(body.customerId), paymentMethodId: body.paymentMethodId ? Number(body.paymentMethodId) : undefined, paidAmount: Number(body.paidAmount) || 0, advanceAmountApplied: Number(body.advanceAmountApplied) || 0, discountAmount: Number(body.discountAmount) || 0, taxAmount: Number(body.taxAmount) || 0, items, createdBy: req.user?.userId || "system" });
            return resp.status(201).json({ status: true, message: "Invoice created successfully", data: result });
        } catch (error: any) {
            return resp.status(400).json({ status: false, message: error.message });
        }
    }

    public async getAll(req: HttpRequest, resp: HttpResponse) {
        try {
            const result = await this.service.getAll(String(req.query.search || "").trim(), Number(req.query.page || 1), Number(req.query.limit || 10));
            return resp.json({ status: true, ...result });
        } catch (error: any) { return resp.status(500).json({ status: false, message: error.message }); }
    }

    public async edit(req: HttpRequest, resp: HttpResponse) {
        try { const data = await this.service.edit(Number(req.params.id)); return data ? resp.json({ status: true, data }) : resp.status(404).json({ status: false, message: "Invoice not found" }); }
        catch (error: any) { return resp.status(500).json({ status: false, message: error.message }); }
    }

    public async update(req: HttpRequest, resp: HttpResponse) {
        try {
            const data = await this.service.update(Number(req.params.id), { ...req.body, customerId: Number(req.body.customerId), updatedBy: req.user?.userId || "system" } as any);
            return resp.json({ status: true, data, message: "Invoice updated successfully" });
        } catch (error: any) { return resp.status(400).json({ status: false, message: error.message }); }
    }

    public async generateNumber(req: HttpRequest, resp: HttpResponse) {
        try { return resp.json({ status: true, invoiceNumber: await this.service.generateInvoiceNumber(String(req.query.customerCode || "GEN")) }); }
        catch (error: any) { return resp.status(500).json({ status: false, message: error.message }); }
    }

    public async recordAdvance(req: HttpRequest, resp: HttpResponse) {
        try { return resp.status(201).json({ status: true, data: await this.service.recordCustomerAdvance({ ...req.body, customerId: Number(req.body.customerId), paymentMethodId: req.body.paymentMethodId ? Number(req.body.paymentMethodId) : undefined, createdBy: req.user?.userId || "system" }) }); }
        catch (error: any) { return resp.status(400).json({ status: false, message: error.message }); }
    }

    public async advanceBalance(req: HttpRequest, resp: HttpResponse) {
        try { return resp.json({ status: true, data: await this.service.getCustomerAdvanceBalance(Number(req.params.customerId)) }); }
        catch (error: any) { return resp.status(400).json({ status: false, message: error.message }); }
    }

    public async generatePdf(req: HttpRequest, resp: HttpResponse) { return this.sendPdf(Number(req.params.id), resp, "attachment"); }
    public async viewPdf(req: HttpRequest, resp: HttpResponse) { return this.sendPdf(Number(req.params.id), resp, "inline"); }

    private async sendPdf(id: number, resp: HttpResponse, disposition: string) {
        try {
            if (!id || isNaN(id)) return resp.status(400).json({ status: false, message: "Invalid invoice ID" });
            const buffer = await this.service.generatePdf(id);
            resp.setHeader("Content-Type", "application/pdf");
            resp.setHeader("Content-Disposition", `${disposition}; filename=invoice-${id}.pdf`);
            return resp.send(buffer);
        } catch (error: any) { return resp.status(500).json({ status: false, message: error.message }); }
    }
}
