import multer from "multer";
import { Controller } from "../../../core/Controller";
import { HttpRequest, HttpResponse } from "../../../core/Types";
import { BlueTechInvoiceReturnService } from "../services/blue_tech_invoice_return_service";

export class BlueTechInvoiceReturnController extends Controller {
    private service: BlueTechInvoiceReturnService;
    private formDataParser = multer().none();
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.service = this.getService("BlueTechInvoiceReturnService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-invoice-returns", [], this.auth.private, this.index);
        this.onPost("/api/bluetech/invoice-returns/create", [this.formDataParser], this.auth.private, this.create);
        this.onGet("/api/bluetech/invoice-returns/all", [], this.auth.private, this.getAll);
        this.onGet("/api/bluetech/invoice-returns/edit/:id", [], this.auth.private, this.getById);
        this.onGet("/api/bluetech/invoice-returns/generate-number", [], this.auth.private, this.generateNumber);
        this.onGet("/api/bluetech/invoice-returns/invoice/:invoiceNumber", [], this.auth.private, this.getInvoiceForReturn);
        this.onGet("/api/bluetech/invoice-returns/invoice-items/:invoiceId", [], this.auth.private, this.getInvoiceItemsForReturn);
        this.onPut("/api/bluetech/invoice-returns/cancel/:id", [this.formDataParser], this.auth.private, this.cancel);
    }

    public async index(req: HttpRequest, resp: HttpResponse) {
        return resp.view("bluetech/bluetech-invoice-returns/index");
    }

    public async create(req: HttpRequest, resp: HttpResponse) {
        try {
            const body = req.body;
            const items = typeof body.items === "string" ? JSON.parse(body.items) : body.items;

            const result = await this.service.create({
                ...body,
                invoiceId: Number(body.invoiceId),
                customerId: body.customerId ? Number(body.customerId) : null,
                subtotal: Number(body.subtotal) || 0,
                refundAmount: Number(body.refundAmount) || 0,
                items,
                createdBy: req.user?.userId || "system"
            });

            return resp.status(201).json({
                status: true,
                message: "Invoice return created successfully",
                data: result
            });
        } catch (error: any) {
            return resp.status(400).json({
                status: false,
                message: error.message
            });
        }
    }

    public async getAll(req: HttpRequest, resp: HttpResponse) {
        try {
            const result = await this.service.getAll(
                String(req.query.search || "").trim(),
                Number(req.query.page || 1),
                Number(req.query.limit || 10)
            );

            return resp.json({
                status: true,
                ...result
            });
        } catch (error: any) {
            return resp.status(500).json({
                status: false,
                message: error.message
            });
        }
    }

    public async getById(req: HttpRequest, resp: HttpResponse) {
        try {
            const id = Number(req.params.id);
            if (!id || isNaN(id)) {
                return resp.status(400).json({ status: false, message: "Invalid return ID" });
            }

            const data = await this.service.getById(id);
            return data
                ? resp.json({ status: true, data })
                : resp.status(404).json({ status: false, message: "Invoice return not found" });
        } catch (error: any) {
            return resp.status(500).json({ status: false, message: error.message });
        }
    }

    public async getInvoiceForReturn(req: HttpRequest, resp: HttpResponse) {
        try {
            const invoiceNumber = decodeURIComponent(String(req.params.invoiceNumber || "")).trim();
            if (!invoiceNumber) {
                return resp.status(400).json({ status: false, message: "Invoice number is required" });
            }

            const data = await this.service.getInvoiceForReturn(invoiceNumber);
            return data
                ? resp.json({ status: true, data })
                : resp.status(404).json({ status: false, message: "Invoice not found" });
        } catch (error: any) {
            return resp.status(500).json({ status: false, message: error.message });
        }
    }

    public async getInvoiceItemsForReturn(req: HttpRequest, resp: HttpResponse) {
        try {
            const invoiceId = Number(req.params.invoiceId);
            if (!invoiceId || isNaN(invoiceId)) {
                return resp.status(400).json({ status: false, message: "Invalid invoice ID" });
            }

            return resp.json({
                status: true,
                data: await this.service.getInvoiceItemsForReturn(invoiceId)
            });
        } catch (error: any) {
            return resp.status(500).json({ status: false, message: error.message });
        }
    }

    public async generateNumber(req: HttpRequest, resp: HttpResponse) {
        try {
            return resp.json({
                status: true,
                returnNumber: await this.service.generateReturnNumber()
            });
        } catch (error: any) {
            return resp.status(500).json({ status: false, message: error.message });
        }
    }

    public async cancel(req: HttpRequest, resp: HttpResponse) {
        try {
            const id = Number(req.params.id);
            if (!id || isNaN(id)) {
                return resp.status(400).json({ status: false, message: "Invalid return ID" });
            }

            const result = await this.service.cancel(id, req.user?.userId || "system");
            return resp.json({ status: true, ...result });
        } catch (error: any) {
            return resp.status(400).json({ status: false, message: error.message });
        }
    }
}
