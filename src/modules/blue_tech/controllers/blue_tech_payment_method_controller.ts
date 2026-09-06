import { Controller } from "../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../core/Types";
import { BlueTechPaymentMethodService } from "../services/blue_tech_payment_method_service";
import { IBlueTechPaymentMethod } from "../interfaces/blue_tech_payment_method_interface";
import ExcelJS from "exceljs";

export class BlueTechPaymentMethodController extends Controller {

    private blueTechPaymentMethodService: BlueTechPaymentMethodService;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.blueTechPaymentMethodService = this.getService("BlueTechPaymentMethodService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-paymentmethod", [], this.auth.private, this.index);
        this.onPost("/bluetech/bluetech-paymentmethod/create", [], this.auth.private, this.create);
        this.onGet("/api/bluetech/bluetech-paymentmethod/all", [], this.auth.private, this.getAll);
        this.onGet("/api/bluetech/bluetech-paymentmethod/edit/:id", [], this.auth.private, this.edit);
        this.onPut("/api/bluetech/bluetech-paymentmethod/update/:id", [], this.auth.private, this.update);
        this.onGet("/api/bluetech/bluetech-paymentmethod/export/excel", [], this.auth.private, this.exportExcel);
    }

    public async index(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        return resp.view("bluetech/bluetech-paymentmethod/index");
    }

    // ✅ CREATE BLUE TECH PAYMENT METHOD
    public async create(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const {
                paymentMethodName,
                paymentMethodDescription,

            } = req.body;

            if (!paymentMethodName) {
                return resp.status(400).json({
                    status: false,
                    message: "Payment method name is required",
                    data: null,
                });
            }

            const createdBy = req.user?.userId || 'system';

            const result = await this.blueTechPaymentMethodService.create({
                paymentMethodName,
                paymentMethodDescription,
                createdBy,
            });

            return resp.status(201).json({
                status: true,
                message: "Blue Tech payment method created successfully",
                data: result,
            });

        } catch (error: any) {
            console.error("Create Blue Tech Payment Method Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to create Blue Tech payment method",
                data: error.message,
            });
        }
    }

    // ✅ GET ALL WITH SEARCH + PAGINATION
    public async getAll(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const { search, page = 1, limit = 10 } = req.query;

            const searchStr = typeof search === "string" ? search.trim() : "";
            const pageNum = Math.max(Number(page), 1);
            const limitNum = Math.min(Math.max(Number(limit), 1), 100);

            const result = await this.blueTechPaymentMethodService.getAll(
                searchStr,
                pageNum,
                limitNum
            );

            return resp.json({
                status: true,
                message: "Blue Tech payment methods fetched successfully",
                ...result,
            });

        } catch (error: any) {
            console.error("GetAll Blue Tech Payment Methods Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to fetch Blue Tech payment methods",
                data: error.message,
            });
        }
    }

    // ✅ EDIT SINGLE ITEM
    public async edit(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const id = Number(req.params.id);

            if (!id) {
                return resp.status(400).json({
                    status: false,
                    message: "Invalid item id",
                });
            }

            const result = await this.blueTechPaymentMethodService.edit(id);

            return resp.json({
                status: true,
                message: "Blue Tech payment method fetched successfully",
                data: result,
            });

        } catch (error: any) {
            console.error("Edit Blue Tech Payment Method Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to fetch payment method",
                data: error.message,
            });
        }
    }

    // ✅ UPDATE ITEM
    public async update(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const id = Number(req.params.id);

            if (!id) {
                return resp.status(400).json({
                    status: false,
                    message: "Invalid item id",
                });
            }

            // 🔥 Get existing item first
            const existing = await this.blueTechPaymentMethodService.edit(id);

            if (!existing) {
                return resp.status(404).json({
                    status: false,
                    message: "Payment method not found",
                });
            }

            // 🔥 Get body values
            const {
                paymentMethodName,
                paymentMethodDescription,
            } = req.body;

            const updatedBy = req.user?.userId || "system";

            // ✅ Prevent null overwrite
            const result = await this.blueTechPaymentMethodService.update(id, {
                paymentMethodName: paymentMethodName ?? existing.paymentMethodName,
                paymentMethodDescription: paymentMethodDescription ?? existing.paymentMethodDescription,
                updatedBy,
            });

            return resp.json({
                status: true,
                message: "Blue Tech payment method updated successfully",
                data: result,
            });

        } catch (error: any) {
            console.error("Update Blue Tech Payment Method Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to update payment method",
                data: error.message,
            });
        }
    }

    public async exportExcel(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const { search, dateRange } = req.query;

            const searchStr = typeof search === "string" ? search.trim() : undefined;


            // ✅ Fetch ALL filtered data (no pagination)
            const { data }: { data: IBlueTechPaymentMethod[] } =
                await this.blueTechPaymentMethodService.getAll(
                    searchStr || "",
                    1,
                    1000000 // large limit for export
                );

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Blue Tech Payment Methods");

            // ✅ Excel columns
            worksheet.columns = [
                { header: "Payment Method Name", key: "paymentMethodName", width: 18 },
                { header: "Payment Method Description", key: "paymentMethodDescription", width: 18 },
                { header: "Created By", key: "createdBy", width: 15 },
                { header: "Updated By", key: "updatedBy", width: 15 },
                { header: "Created At", key: "created_at", width: 22 },
                { header: "Updated At", key: "updated_at", width: 22 }
            ];

            // ✅ Add rows
            data.forEach(row => {
                worksheet.addRow({
                    paymentMethodName: row.paymentMethodName ?? "",
                    paymentMethodDescription: row.paymentMethodDescription ?? "",
                    createdBy: row.createdBy ?? "",
                    updatedBy: row.updatedBy ?? "",
                    created_at: row.created_at || "",
                    updated_at: row.updated_at || ""
                });
            });

            // ✅ Header styling
            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "580db4" } // bluetech Colour
                };
                cell.alignment = { horizontal: "center" };
            });

            worksheet.eachRow(row => {
                row.height = 22;
            });

            // ✅ Response headers
            resp.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            resp.setHeader(
                "Content-Disposition",
                `attachment; filename=blue_tech_payment_methods_${Date.now()}.xlsx`
            );

            await workbook.xlsx.write(resp);
            resp.end();

        } catch (error: any) {
            console.error("Error exporting Blue Tech Payment Methods Excel:", error);
            return resp.status(500).json({
                status: false,
                message: "An error occurred while exporting Blue Tech Payment Methods Excel",
                error: error.message,
            });
        }
    }
}