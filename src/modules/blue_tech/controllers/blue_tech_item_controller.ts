import { Controller } from "../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../core/Types";
import { BlueTechItemsService } from "../services/blue_tech_item_service";
import { IBlueTechItems } from "../interfaces/blue_tech_item_interface";
import ExcelJS from "exceljs";

export class BlueTechItemsController extends Controller {

    private blueTechItemsService: BlueTechItemsService;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.blueTechItemsService = this.getService("BlueTechItemsService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-items", [], this.auth.private, this.index);
        this.onPost("/bluetech/bluetech-items/create", [], this.auth.private, this.create);
        this.onGet("/api/bluetech/bluetech-items/all", [], this.auth.private, this.getAll);
        this.onGet("/api/bluetech/bluetech-items/edit/:id", [], this.auth.private, this.edit);
        this.onPut("/api/bluetech/bluetech-items/update/:id", [], this.auth.private, this.update);
        this.onGet("/api/bluetech/bluetech-items/export/excel", [], this.auth.private, this.exportExcel);
    }

    public async index(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        return resp.view("bluetech/bluetech-items/index");
    }

    // ✅ CREATE BLUE TECH ITEM
    public async create(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const {
                itemType,
                manufactureOrigin,
                itemName,
                itemPrice,
                itemConfigurations,
                imeiNumber,
            } = req.body;

            if (!itemName) {
                return resp.status(400).json({
                    status: false,
                    message: "Item name is required",
                    data: null,
                });
            }

            const createdBy = req.user?.userId || 'system';

            const result = await this.blueTechItemsService.create({
                itemType,
                manufactureOrigin,
                itemName,
                itemPrice,
                itemConfigurations,
                imeiNumber,
                createdBy,
            });

            return resp.status(201).json({
                status: true,
                message: "Blue Tech item created successfully",
                data: result,
            });

        } catch (error: any) {
            console.error("Create Blue Tech Item Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to create Blue Tech item",
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

            const result = await this.blueTechItemsService.getAll(
                searchStr,
                pageNum,
                limitNum
            );

            return resp.json({
                status: true,
                message: "Blue Tech items fetched successfully",
                ...result,
            });

        } catch (error: any) {
            console.error("GetAll Blue Tech Items Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to fetch Blue Tech items",
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

            const result = await this.blueTechItemsService.edit(id);

            return resp.json({
                status: true,
                message: "Blue Tech item fetched successfully",
                data: result,
            });

        } catch (error: any) {
            console.error("Edit Blue Tech Item Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to fetch item",
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
            const existing = await this.blueTechItemsService.edit(id);

            if (!existing) {
                return resp.status(404).json({
                    status: false,
                    message: "Item not found",
                });
            }

            // 🔥 Get body values
            const {
                itemType,
                manufactureOrigin,
                itemName,
                itemPrice,
                itemConfigurations,
                imeiNumber,
            } = req.body;

            const updatedBy = req.user?.userId || "system";

            // ✅ Prevent null overwrite
            const result = await this.blueTechItemsService.update(id, {
                itemType: itemType ?? existing.itemType,
                manufactureOrigin: manufactureOrigin ?? existing.manufactureOrigin,
                itemName: itemName ?? existing.itemName,
                itemPrice: itemPrice ?? existing.itemPrice,
                itemConfigurations: itemConfigurations ?? existing.itemConfigurations,
                imeiNumber: imeiNumber ?? existing.imeiNumber,
                updatedBy,
            });

            return resp.json({
                status: true,
                message: "Blue Tech item updated successfully",
                data: result,
            });

        } catch (error: any) {
            console.error("Update Blue Tech Item Error:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to update item",
                data: error.message,
            });
        }
    }

    public async exportExcel(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const { search, dateRange } = req.query;

            const searchStr = typeof search === "string" ? search.trim() : undefined;


            // ✅ Fetch ALL filtered data (no pagination)
            const { data }: { data: IBlueTechItems[] } =
                await this.blueTechItemsService.getAll(
                    searchStr || "",
                    1,
                    1000000 // large limit for export
                );

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Blue Tech Items");

            // ✅ Excel columns
            worksheet.columns = [
                { header: "Item Name", key: "itemName", width: 18 },
                { header: "Item Type", key: "itemType", width: 18 },
                { header: "Manufacture Origin", key: "manufactureOrigin", width: 25 },
                { header: "Item Price", key: "itemPrice", width: 15 },
                { header: "Item Configurations", key: "itemConfigurations", width: 100 },
                { header: "IMEI Number", key: "imeiNumber", width: 20 },
                { header: "Created By", key: "createdBy", width: 15 },
                { header: "Updated By", key: "updatedBy", width: 15 },
                { header: "Created At", key: "created_at", width: 22 },
                { header: "Updated At", key: "updated_at", width: 22 }
            ];

            // ✅ Add rows
            data.forEach(row => {
                worksheet.addRow({
                    itemName: row.itemName ?? "",
                    itemType: row.itemType ?? "",
                    manufactureOrigin: row.manufactureOrigin ?? "",
                    itemPrice: row.itemPrice ?? "",
                    itemConfigurations: row.itemConfigurations ?? "",
                    imeiNumber: row.imeiNumber ?? "",
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
                `attachment; filename=blue_tech_items_${Date.now()}.xlsx`
            );

            await workbook.xlsx.write(resp);
            resp.end();

        } catch (error: any) {
            console.error("Error exporting Blue Tech Items Excel:", error);
            return resp.status(500).json({
                status: false,
                message: "An error occurred while exporting Blue Tech Items Excel",
                error: error.message,
            });
        }
    }
}