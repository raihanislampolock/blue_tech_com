import { Controller } from "../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../core/Types";
import { BlueTechSupplierService } from "../services/blue_tech_supplier_service";
import { IBlueTechSupplier } from "../interfaces/blue_tech_supplier_interface";
import ExcelJS from "exceljs";

export class BlueTechSupplierController extends Controller {

    private blueTechSupplierService: BlueTechSupplierService;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.blueTechSupplierService = this.getService("BlueTechSupplierService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-suppliers", [], this.auth.private, this.index);
        this.onPost("/bluetech/bluetech-suppliers/create", [], this.auth.private, this.create);
        this.onGet("/api/bluetech/bluetech-suppliers/all", [], this.auth.private, this.getAll);
        this.onGet("/api/bluetech/bluetech-suppliers/edit/:id", [], this.auth.private, this.edit);
        this.onPut("/api/bluetech/bluetech-suppliers/update/:id", [], this.auth.private, this.update);
        this.onGet("/api/bluetech/bluetech-suppliers/export/excel", [], this.auth.private, this.exportExcel);
    }

    public async index(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        return resp.view("bluetech/bluetech-suppliers/index");
    }

    // ✅ CREATE BLUE TECH SUPPLIER
    public async create(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const {
                supplierName,
                supplierEmail,
                supplierNumber,
                supplierAddress,
                note,

            } = req.body;

            if (!supplierName) {
                return resp.status(400).json({
                    status: false,
                    message: "Supplier name is required",
                    data: null,
                });
            }

            const createdBy = req.user?.userId || 'system';

            const result = await this.blueTechSupplierService.create({
                supplierName,
                supplierEmail,
                supplierNumber,
                supplierAddress,
                note,
                createdBy,
            });

            return resp.status(201).json({
                status: true,
                message: "Blue Tech supplier created successfully",
                data: result,
            });

        } catch (error: any) {
            console.error("Create Blue Tech Supplier Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to create Blue Tech supplier",
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

            const result = await this.blueTechSupplierService.getAll(
                searchStr,
                pageNum,
                limitNum
            );

            return resp.json({
                status: true,
                message: "Blue Tech suppliers fetched successfully",
                ...result,
            });

        } catch (error: any) {
            console.error("GetAll Blue Tech Suppliers Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to fetch Blue Tech suppliers",
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

            const result = await this.blueTechSupplierService.edit(id);

            return resp.json({
                status: true,
                message: "Blue Tech supplier fetched successfully",
                data: result,
            });

        } catch (error: any) {
            console.error("Edit Blue Tech Supplier Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to fetch supplier",
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
            const existing = await this.blueTechSupplierService.edit(id);

            if (!existing) {
                return resp.status(404).json({
                    status: false,
                    message: "Supplier not found",
                });
            }

            // 🔥 Get body values
            const {
                supplierName,
                supplierEmail,
                supplierNumber,
                supplierAddress,
                note,
            } = req.body;

            const updatedBy = req.user?.userId || "system";

            // ✅ Prevent null overwrite
            const result = await this.blueTechSupplierService.update(id, {
                supplierName: supplierName ?? existing.supplierName,
                supplierEmail: supplierEmail ?? existing.supplierEmail,
                supplierNumber: supplierNumber ?? existing.supplierNumber,
                supplierAddress: supplierAddress ?? existing.supplierAddress,
                note: note ?? existing.note,
                updatedBy,
            });

            return resp.json({
                status: true,
                message: "Blue Tech supplier updated successfully",
                data: result,
            });

        } catch (error: any) {
            console.error("Update Blue Tech Supplier Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to update supplier",
                data: error.message,
            });
        }
    }

    public async exportExcel(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const { search, dateRange } = req.query;

            const searchStr = typeof search === "string" ? search.trim() : undefined;


            // ✅ Fetch ALL filtered data (no pagination)
            const { data }: { data: IBlueTechSupplier[] } =
                await this.blueTechSupplierService.getAll(
                    searchStr || "",
                    1,
                    1000000 // large limit for export
                );

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Blue Tech Suppliers");

            // ✅ Excel columns
            worksheet.columns = [
                { header: "Supplier Name", key: "supplierName", width: 18 },
                { header: "Supplier Email", key: "supplierEmail", width: 18 },
                { header: "Supplier Number", key: "supplierNumber", width: 25 },
                { header: "Supplier Address", key: "supplierAddress", width: 25 },
                { header: "Note", key: "note", width: 100 },
                { header: "Created By", key: "createdBy", width: 15 },
                { header: "Updated By", key: "updatedBy", width: 15 },
                { header: "Created At", key: "created_at", width: 22 },
                { header: "Updated At", key: "updated_at", width: 22 }
            ];

            // ✅ Add rows
            data.forEach(row => {
                worksheet.addRow({
                    supplierName: row.supplierName ?? "",
                    supplierEmail: row.supplierEmail ?? "",
                    supplierNumber: row.supplierNumber ?? "",
                    supplierAddress: row.supplierAddress ?? "",
                    note: row.note ?? "",
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
                `attachment; filename=blue_tech_suppliers_${Date.now()}.xlsx`
            );

            await workbook.xlsx.write(resp);
            resp.end();

        } catch (error: any) {
            console.error("Error exporting Blue Tech Suppliers Excel:", error);
            return resp.status(500).json({
                status: false,
                message: "An error occurred while exporting Blue Tech Suppliers Excel",
                error: error.message,
            });
        }
    }
}