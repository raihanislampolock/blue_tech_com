import { Controller } from "../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../core/Types";
import { BlueTechPurchaseService } from "../services/blue_tech_purchase_service";
import ExcelJS from "exceljs";


export class BlueTechPurchaseController extends Controller {

    private blueTechPurchaseService: BlueTechPurchaseService;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.blueTechPurchaseService = this.getService("BlueTechPurchaseService");
    }

    public onRegister(): void {
        this.onGet("/bluetech/bluetech-purchase", [], this.auth.private, this.index);
        this.onPost("/api/bluetech/bluetech-purchase/create", [], this.auth.private, this.create);
        this.onGet("/api/bluetech/bluetech-purchase/all", [], this.auth.private, this.getAll);
        this.onGet("/api/bluetech/bluetech-purchase/edit/:id", [], this.auth.private, this.edit);
        this.onPut("/api/bluetech/bluetech-purchase/update/:id", [], this.auth.private, this.update);
        this.onGet("/api/bluetech/bluetech-purchase/generate-number", [], this.auth.private, this.generateNumber);
        this.onGet("/api/bluetech/bluetech-purchase/generate-pdf/:id", [], this.auth.private, this.generatePdf);
        // this.onPost("/api/bluetech/bluetech-purchase/send-email/:id", [], this.auth.private, this.sendEmailWithPdf);
        this.onGet("/api/bluetech/bluetech-purchase/view-pdf/:id", [], this.auth.private, this.viewPdf);
        this.onGet("/api/bluetech/bluetech-purchase/export/excel", [], this.auth.private, this.exportExcel);

    }

    // ===============================
    // ✅ PAGE LOAD
    // ===============================
    public async index(req: HttpRequest, resp: HttpResponse) {
        try {
            const items = await this.blueTechPurchaseService.getItemDropdown();
            const suppliers = await this.blueTechPurchaseService.getSupplierDropdown();
            const paymentMethods = await this.blueTechPurchaseService.getPaymentMethodDropdown();

            return resp.view("bluetech/bluetech-purchase/index", {
                items,
                suppliers,
                paymentMethods
            });

        } catch (error) {
            console.error(error);
            return resp.view("bluetech/bluetech-purchase/index", {
                items: [],
                suppliers: [],
                paymentMethods: []
            });
        }
    }

    // ===============================
    // ✅ CREATE
    // ===============================
    public async create(req: HttpRequest, resp: HttpResponse) {
        try {
            const {
                purchaseNumber,
                supplierName,
                imeiNumber,
                qty,
                purchasesPrice,
                advancePayment,
                duePayment,
                paymentMethod,
                notes,
                items
            } = req.body;

            const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;

            // ✅ VALIDATION
            if (!purchaseNumber || !itemsArray?.length) {
                return resp.status(400).json({
                    status: false,
                    message: "Purchase number and items are required"
                });
            }

            const createdBy = req.user?.userId || "system";

            await this.blueTechPurchaseService.create({
                purchaseNumber,
                supplierName,
                imeiNumber,
                qty,
                purchasesPrice,
                advancePayment,
                duePayment,
                paymentMethod,
                notes,
                createdBy,
                items: itemsArray
            });

            return resp.status(201).json({
                status: true,
                message: ""
            });

        } catch (error: any) {
            console.error(error);
            return resp.status(500).json({
                status: false,
                message: "Create failed",
                data: error.message
            });
        }
    }

    // ===============================
    // ✅ GET ALL
    // ===============================
    public async getAll(req: HttpRequest, resp: HttpResponse) {
        try {
            const { search, page = 1, limit = 10 } = req.query;

            const result = await this.blueTechPurchaseService.getAll(
                typeof search === "string" ? search.trim() : "",
                Number(page),
                Number(limit)
            );

            return resp.json({
                status: true,
                message: "Fetched successfully",
                ...result
            });

        } catch (error: any) {
            return resp.status(500).json({
                status: false,
                message: error.message
            });
        }
    }

    // ===============================
    // ✅ EDIT
    // ===============================
    public async edit(req: HttpRequest, resp: HttpResponse) {
        try {
            const id = Number(req.params.id);

            if (!req.params.id || isNaN(id)) {
                return resp.status(400).json({
                    status: false,
                    message: "Invalid purchase ID"
                });
            }

            const purchase = await this.blueTechPurchaseService.edit(id);

            return resp.json({
                status: true,
                data: purchase
            });

        } catch (error: any) {
            return resp.status(500).json({
                status: false,
                message: error.message
            });
        }
    }

    // ===============================
    // ✅ UPDATE
    // ===============================
    public async update(req: HttpRequest, resp: HttpResponse) {
        try {
            const id = Number(req.params.id);

            if (!req.params.id || isNaN(id)) {
                return resp.status(400).json({
                    status: false,
                    message: "Invalid purchase ID"
                });
            }

            const {
                supplierName,
                imeiNumber,
                qty,
                purchasesPrice,
                advancePayment,
                duePayment,
                paymentMethod,
                notes,
                items
            } = req.body;

            const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;

            const existing = await this.blueTechPurchaseService.edit(id);
            if (!existing) {
                return resp.status(404).json({
                    status: false,
                    message: "Purchase not found"
                });
            }

            const updatedBy = req.user?.userId || "system";

            await this.blueTechPurchaseService.update(
                id,
                {
                    supplierName,
                    imeiNumber,
                    qty,
                    purchasesPrice,
                    advancePayment,
                    duePayment,
                    paymentMethod,
                    notes,
                    updatedBy
                },
                itemsArray
            );

            return resp.json({
                status: true,
                message: ""
            });

        } catch (error: any) {
            console.error(error);
            return resp.status(500).json({
                status: false,
                message: error.message
            });
        }
    }

    // ===============================
    // 🔢 GENERATE PURCHASE NUMBER
    // ===============================
    public async generateNumber(req: HttpRequest, resp: HttpResponse) {
        try {
            const supplierCode = req.query.supplierCode || "GEN";

            const purchaseNumber =
                await this.blueTechPurchaseService.generatePurchaseNumber(
                    String(supplierCode)
                );

            return resp.json({
                status: true,
                purchaseNumber
            });

        } catch (error: any) {
            return resp.status(500).json({
                status: false,
                message: error.message
            });
        }
    }

    // ===============================
    // 🔢 GENERATE PDF
    // ===============================
    public async generatePdf(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const rawId = req.params.id;

            const id = Number(rawId);

            // ✅ VALIDATION
            if (!rawId || isNaN(id)) {
                return resp.status(400).json({
                    status: false,
                    message: "Invalid purchase ID"
                });
            }

            const result = await this.blueTechPurchaseService.generatePdf(id);

            resp.setHeader('Content-Type', 'application/pdf');
            resp.setHeader('Content-Disposition', `attachment; filename=purchase-${id}.pdf`);
            return resp.send(result.pdfBuffer);

        } catch (error: any) {
            console.error(error);
            return resp.status(500).json({
                status: false,
                message: error.message
            });
        }
    }

    // public async sendEmailWithPdf(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    //     try {
    //         const rawId = req.params.id;
    //         const id = Number(rawId);

    //         // ✅ VALIDATION
    //         if (!rawId || isNaN(id)) {
    //             return resp.status(400).json({
    //                 status: false,
    //                 message: "Invalid purchase ID"
    //             });
    //         }

    //         // Get purchase data
    //         const purchase = await this.blueTechPurchaseService.edit(id);
    //         if (!purchase) {
    //             return resp.status(404).json({
    //                 status: false,
    //                 message: "Purchase not found"
    //             });
    //         }


    //         // Generate PDF
    //         const pdfResult = await this.blueTechPurchaseService.generatePdf(id);

    //         // Send email with PDF
    //         const PurchaseEmailService = require("../../../utils/purchase-email.service").PurchaseEmailService;
    //         const emailService = new PurchaseEmailService();

    //         await emailService.sendPurchasePdf(
    //             purchase.supplierEmail,
    //             purchase.supplierName,
    //             pdfResult.pdfBuffer,
    //             purchase.purchaseNumber
    //         );

    //         return resp.json({
    //             status: true,
    //             message: `✅ Email sent successfully to ${purchase.supplierEmail}`
    //         });

    //     } catch (error: any) {
    //         console.error('Error sending email:', error);
    //         return resp.status(500).json({
    //             status: false,
    //             message: error.message || "Failed to send email"
    //         });
    //     }
    // }

    public async viewPdf(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const rawId = req.params.id;
            const id = Number(rawId);

            if (!rawId || isNaN(id)) {
                return resp.status(400).json({
                    status: false,
                    message: "Invalid purchase ID"
                });
            }

            const result = await this.blueTechPurchaseService.generatePdf(id);

            resp.setHeader('Content-Type', 'application/pdf');
            resp.setHeader('Content-Disposition', `inline; filename=purchase-${id}.pdf`);
            return resp.send(result.pdfBuffer);

        } catch (error: any) {
            console.error(error);
            return resp.status(500).json({
                status: false,
                message: error.message
            });
        }
    }

    public async exportExcel(
        req: HttpRequest,
        resp: HttpResponse,
        next: NextFunc
    ) {
        try {
            const { search } = req.query;

            const searchStr =
                typeof search === "string"
                    ? search.trim()
                    : "";

            const { data }: { data: any[] } =
                await this.blueTechPurchaseService.getAll(
                    searchStr,
                    1,
                    1000000
                );

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Blue Tech Purchases");

            worksheet.columns = [
                { header: "Purchase No", key: "purchaseNumber", width: 20 },
                { header: "Supplier Name", key: "supplierName", width: 30 },
                { header: "IMEI Number", key: "imeiNumber", width: 30 },
                { header: "Quantity", key: "qty", width: 20 },
                { header: "Total Price", key: "purchasesPrice", width: 20 },
                { header: "Advance Payment", key: "advancePayment", width: 20 },
                { header: "Due Payment", key: "duePayment", width: 20 },
                { header: "Payment Method", key: "paymentMethod", width: 20 },
                { header: "Notes", key: "notes", width: 40 },

                { header: "Item ID", key: "itemId", width: 15 },
                { header: "Item Name", key: "itemName", width: 30 },
                { header: "Item Type", key: "itemType", width: 20 },
                { header: "Manufacture Origin", key: "manufactureOrigin", width: 25 },

                { header: "Quantity", key: "quantity", width: 15 },
                { header: "Unit Price", key: "unitPrice", width: 15 },
                { header: "Total Price", key: "totalPrice", width: 18 },

                { header: "Item Configurations", key: "itemConfigurations", width: 80 },
                { header: "Item Notes", key: "itemNotes", width: 40 },
                { header: "Purchase Notes", key: "purchaseNotes", width: 40 },

                { header: "Created By", key: "createdBy", width: 15 },
                { header: "Updated By", key: "updatedBy", width: 15 },
                { header: "Username", key: "username", width: 20 },

                { header: "Created At", key: "createdAt", width: 25 },
                { header: "Updated At", key: "updatedAt", width: 25 }
            ];

            // One row per item
            data.forEach((row: any) => {
                worksheet.addRow({
                    purchaseNumber: row.purchaseNumber ?? "",
                    supplierName: row.supplierName ?? "",
                    imeiNumber: row.imeiNumber ?? "",
                    qty: row.qty ?? 0,
                    purchasesPrice: row.purchasesPrice ?? 0,
                    advancePayment: row.advancePayment ?? 0,
                    duePayment: row.duePayment ?? 0,
                    paymentMethod: row.paymentMethod ?? "",
                    notes: row.notes ?? "",

                    itemId: row.itemId ?? "",
                    itemName: row.itemName ?? "",
                    itemType: row.itemType ?? "",
                    manufactureOrigin: row.manufactureOrigin ?? "",

                    quantity: row.quantity ?? 0,
                    unitPrice: row.unitPrice ?? 0,
                    totalPrice: row.totalPrice ?? 0,

                    itemConfigurations: row.itemConfigurations ?? "",
                    itemNotes: row.itemNotes ?? "",
                    purchaseNotes: row.notes ?? "",

                    createdBy: row.createdBy ?? "",
                    updatedBy: row.updatedBy ?? "",
                    username: row.username ?? "",

                    createdAt: row.createdAt
                        ? new Date(row.createdAt).toLocaleString()
                        : "",

                    updatedAt: row.updatedAt
                        ? new Date(row.updatedAt).toLocaleString()
                        : ""
                });
            });

            // Header Style
            const headerRow = worksheet.getRow(1);

            headerRow.eachCell((cell) => {
                cell.font = {
                    bold: true,
                    color: { argb: "FFFFFFFF" }
                };

                cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: {
                        argb: "580DB4"
                    }
                };

                cell.alignment = {
                    horizontal: "center",
                    vertical: "middle"
                };

                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };
            });

            worksheet.eachRow((row, rowNumber) => {
                row.height = 22;

                if (rowNumber > 1) {
                    row.eachCell((cell) => {
                        cell.alignment = {
                            vertical: "middle",
                            wrapText: true
                        };
                    });
                }
            });

            worksheet.views = [
                {
                    state: "frozen",
                    ySplit: 1
                }
            ];

            resp.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );

            resp.setHeader(
                "Content-Disposition",
                `attachment; filename=blue_tech_purchases_${Date.now()}.xlsx`
            );

            await workbook.xlsx.write(resp);

            resp.end();
        } catch (error: any) {
            console.error(
                "Error exporting Blue Tech Purchase Excel:",
                error
            );

            return resp.status(500).json({
                status: false,
                message:
                    "An error occurred while exporting Blue Tech Purchase Excel",
                error: error.message
            });
        }
    }
}
