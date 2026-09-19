import multer from "multer";
import { Controller } from "../../../core/Controller";
import { HttpRequest, HttpResponse } from "../../../core/Types";
import { BlueTechPurchaseReturnService } from "../services/blue_tech_purchase_return_service";

export class BlueTechPurchaseReturnController extends Controller {
    private service: BlueTechPurchaseReturnService;
    private formDataParser = multer().none();
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.service = this.getService("BlueTechPurchaseReturnService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-purchase-returns", [], this.auth.private, this.index);
        this.onPost("/api/bluetech/purchase-returns/create", [this.formDataParser], this.auth.private, this.create);
        this.onGet("/api/bluetech/purchase-returns/all", [], this.auth.private, this.getAll);
        this.onGet("/api/bluetech/purchase-returns/edit/:id", [], this.auth.private, this.getById);
        this.onGet("/api/bluetech/purchase-returns/generate-number", [], this.auth.private, this.generateNumber);
        this.onGet("/api/bluetech/purchase-returns/purchase/:purchaseNumber", [], this.auth.private, this.getPurchaseForReturn);
        this.onGet("/api/bluetech/purchase-returns/purchase-items/:purchaseId", [], this.auth.private, this.getPurchaseItemsForReturn);
        this.onPut("/api/bluetech/purchase-returns/cancel/:id", [this.formDataParser], this.auth.private, this.cancel);
    }

    public async index(req: HttpRequest, resp: HttpResponse) {
        return resp.view("bluetech/bluetech-purchase-returns/index");
    }

    public async create(req: HttpRequest, resp: HttpResponse) {
        try {
            const body = req.body;
            const items = typeof body.items === "string" ? JSON.parse(body.items) : body.items;

            const result = await this.service.create({
                ...body,
                purchaseId: Number(body.purchaseId),
                subtotal: Number(body.subtotal) || 0,
                creditAmount: Number(body.creditAmount) || 0,
                items,
                createdBy: req.user?.userId || "system"
            });

            return resp.status(201).json({
                status: true,
                message: "Purchase return created successfully",
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
                : resp.status(404).json({ status: false, message: "Purchase return not found" });
        } catch (error: any) {
            return resp.status(500).json({ status: false, message: error.message });
        }
    }

    public async getPurchaseForReturn(req: HttpRequest, resp: HttpResponse) {
        try {
            const purchaseNumber = decodeURIComponent(String(req.params.purchaseNumber || "")).trim();
            if (!purchaseNumber) {
                return resp.status(400).json({ status: false, message: "Purchase number is required" });
            }

            const data = await this.service.getPurchaseForReturn(purchaseNumber);
            return data
                ? resp.json({ status: true, data })
                : resp.status(404).json({ status: false, message: "Purchase not found" });
        } catch (error: any) {
            return resp.status(500).json({ status: false, message: error.message });
        }
    }

    public async getPurchaseItemsForReturn(req: HttpRequest, resp: HttpResponse) {
        try {
            const purchaseId = Number(req.params.purchaseId);
            if (!purchaseId || isNaN(purchaseId)) {
                return resp.status(400).json({ status: false, message: "Invalid purchase ID" });
            }

            return resp.json({
                status: true,
                data: await this.service.getPurchaseItemsForReturn(purchaseId)
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
