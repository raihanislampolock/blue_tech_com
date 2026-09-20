import { Controller } from "../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../core/Types";
import { BlueTechCustomerAdvancePaymentService } from "../services/blue_tech_customer_advance_payment_service";
import { IBlueTechCustomerAdvancePaymentMethod } from "../interfaces/blue_tech_customer_advance_payment_interface";
import ExcelJS from "exceljs";

export class BlueTechCustomerAdvancePaymentController extends Controller {

    private blueTechCustomerAdvancePaymentService: BlueTechCustomerAdvancePaymentService;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.blueTechCustomerAdvancePaymentService = this.getService("BlueTechCustomerAdvancePaymentService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-customer-advance-payment", [], this.auth.private, this.index);
        this.onGet("/api/bluetech/bluetech-customer-advance-payments/all", [], this.auth.private, this.getAll);
        this.onGet("/api/bluetech/bluetech-customer-advance-payments/export/excel", [], this.auth.private, this.exportExcel);
    }

    public async index(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        return resp.view("bluetech/bluetech-customer-advance-payment/index");
    }

    // ✅ GET ALL WITH SEARCH + PAGINATION
    public async getAll(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const { search, page = 1, limit = 10 } = req.query;

            const searchStr = typeof search === "string" ? search.trim() : "";
            const pageNum = Math.max(Number(page), 1);
            const limitNum = Math.min(Math.max(Number(limit), 1), 100);

            const result = await this.blueTechCustomerAdvancePaymentService.getAll(
                searchStr,
                pageNum,
                limitNum
            );

            return resp.json({
                status: true,
                message: "Blue Tech Customer AdvancePayment fetched successfully",
                ...result,
            });

        } catch (error: any) {
            console.error("GetAll Blue Tech Customer AdvancePayments Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to fetch Blue Tech Customer AdvancePayments",
                data: error.message,
            });
        }
    }

    public async exportExcel(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const { search, dateRange } = req.query;

            const searchStr = typeof search === "string" ? search.trim() : undefined;


            // ✅ Fetch ALL filtered data (no pagination)
            const { data }: { data: IBlueTechCustomerAdvancePaymentMethod[] } =
                await this.blueTechCustomerAdvancePaymentService.getAll(
                    searchStr || "",
                    1,
                    1000000 // large limit for export
                );

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Blue Tech Customer Advance Payments");

            // ✅ Excel columns
            worksheet.columns = [
                { header: "Supplier Name", key: "customerName", width: 18 },
                { header: "Advance Amount", key: "advance_amount", width: 18 },
                { header: "Settled Amount", key: "settled_amount", width: 25 },
                { header: "Remaining Amount", key: "remaining_amount", width: 15 },
                { header: "Payment Method", key: "paymentMethod", width: 100 },
                { header: "Notes", key: "notes", width: 20 },
                { header: "Created By", key: "created_by", width: 15 },
                { header: "Created At", key: "created_at", width: 22 }
            ];

            // ✅ Add rows
            data.forEach(row => {
                worksheet.addRow({
                    supplierName: row.customerName ?? "",
                    advance_amount: row.advance_amount ?? "",
                    settled_amount: row.settled_amount ?? "",
                    remaining_amount: row.remaining_amount ?? "",
                    paymentMethod: row.paymentMethod ?? "",
                    notes: row.notes ?? "",
                    created_by: row.created_by ?? "",
                    created_at: row.created_at || ""
                });
            });

            // ✅ Header styling
            worksheet.getRow(1).eachCell(cell => {
                cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "580db4" } // RMS Colour
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
                `attachment; filename=blue_tech_customer_advance_payments_${Date.now()}.xlsx`
            );

            await workbook.xlsx.write(resp);
            resp.end();

        } catch (error: any) {
            console.error("Error exporting Blue Tech Customer Advance Payments Excel:", error);
            return resp.status(500).json({
                status: false,
                message: "An error occurred while exporting Blue Tech Customer Advance Payments Excel",
                error: error.message,
            });
        }
    }
}