import fs from "fs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { IBlueTechInvoice, IBlueTechInvoiceRepository } from "../interfaces/blue_tech_invoice_interface";
import { BlueTechInvoiceRepository } from "../repositories/blue_tech_invoice_repository";

export class BlueTechInvoiceService {
    private repository: BlueTechInvoiceRepository;

    constructor(repository: IBlueTechInvoiceRepository) {
        this.repository = repository as BlueTechInvoiceRepository;
    }

    public async create(data: Partial<IBlueTechInvoice>): Promise<any> {
        if (!data.invoiceNumber || !data.customerId || !data.items?.length) {
            throw new Error("Invoice number, customer, and items are required");
        }
        return this.repository.create(data as IBlueTechInvoice);
    }

    public getAll(search: string, page: number, limit: number): Promise<any> {
        return this.repository.getAll(search, page, limit);
    }

    public edit(id: number): Promise<any | null> {
        return this.repository.edit(id);
    }

    public update(id: number, data: IBlueTechInvoice): Promise<any> {
        return this.repository.update(id, data);
    }

    public generateInvoiceNumber(customerCode: string): Promise<string> {
        return this.repository.generateInvoiceNumber(customerCode);
    }

    public recordCustomerAdvance(data: any): Promise<any> {
        return this.repository.recordCustomerAdvance(data);
    }

    public getCustomerAdvanceBalance(customerId: number): Promise<any> {
        return this.repository.getCustomerAdvanceBalance(customerId);
    }

    public getItemDropdown(): Promise<any[]> {
        return this.repository.getItemDropdown();
    }

    public getCustomerDropdown(): Promise<any[]> {
        return this.repository.getCustomerDropdown();
    }

    public getPaymentMethodDropdown(): Promise<any[]> {
        return this.repository.getPaymentMethodDropdown();
    }

    public async generatePdf(id: number): Promise<Buffer> {
        const invoice = await this.edit(id);
        if (!invoice) throw new Error("Invoice not found");

        const pdf = await PDFDocument.create();
        const page = pdf.addPage([595.28, 841.89]);
        const font = await pdf.embedFont(StandardFonts.Helvetica);
        const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
        const margin = 40;
        let y = 760;
        const money = (value: any) => Number(value || 0).toFixed(2);

        const image = async (path: string) => {
            try { return await pdf.embedPng(fs.readFileSync(path)); } catch { return null; }
        };
        const header = await image("src/public/dist/img/header.png");
        const footer = await image("src/public/dist/img/footer.png");
        const signature = await image("src/public/dist/img/rms-sig.png");
        if (header) page.drawImage(header, { x: 0, y: 757, width: 595.28, height: 85 });
        if (footer) page.drawImage(footer, { x: 0, y: 0, width: 595.28, height: 65 });

        page.drawText("Blue Tech Solutions", { x: margin, y, size: 20, font: bold, color: rgb(0.11, 0.16, 0.23) });
        page.drawText("SALES INVOICE", { x: margin, y: y - 22, size: 11, font: bold, color: rgb(0.44, 0.5, 0.59) });
        page.drawText(`Invoice No: ${invoice.invoiceNumber}`, { x: 370, y, size: 9, font: bold });
        page.drawText(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, { x: 370, y: y - 16, size: 9, font });
        page.drawText(`Customer: ${invoice.customerNameSnapshot || invoice.customer?.customerName || "N/A"}`, { x: 370, y: y - 32, size: 9, font });
        page.drawText(`Phone: ${invoice.customerPhoneSnapshot || invoice.customer?.phoneNumber || "N/A"}`, { x: 370, y: y - 48, size: 9, font });
        y -= 90;

        const columns = [40, 75, 330, 390, 475, 555];
        page.drawRectangle({ x: 40, y: y - 18, width: 515, height: 22, color: rgb(0.92, 0.94, 0.96) });
        ["SL", "Item Description", "Qty", "Unit Price", "Amount"].forEach((label, index) => page.drawText(label, { x: columns[index] + 6, y: y - 10, size: 9, font: bold }));
        y -= 36;
        for (const [index, item] of (invoice.items || []).entries()) {
            const amount = Number(item.totalPrice || Number(item.quantity) * Number(item.unitPrice));
            page.drawText(String(index + 1), { x: columns[0] + 6, y, size: 9, font });
            page.drawText(String(item.itemNameSnapshot || item.item?.itemName || "Item").substring(0, 42), { x: columns[1] + 6, y, size: 9, font });
            page.drawText(String(item.quantity), { x: columns[2] + 6, y, size: 9, font });
            page.drawText(money(item.unitPrice), { x: columns[3] + 6, y, size: 9, font });
            page.drawText(money(amount), { x: columns[4] + 6, y, size: 9, font });
            page.drawLine({ start: { x: 40, y: y - 8 }, end: { x: 555, y: y - 8 }, thickness: 0.5, color: rgb(0.75, 0.77, 0.8) });
            y -= 24;
        }
        y -= 10;
        const totals = [
            ["Subtotal:", money(invoice.subtotal)],
            ["Discount:", money(invoice.discountAmount)],
            ["Tax:", money(invoice.taxAmount)],
            ["Total:", money(invoice.totalAmount)],
            ["Advance Applied:", money(invoice.advanceAmountApplied)],
            ["Paid:", money(invoice.paidAmount)],
            ["Due:", money(invoice.dueAmount)]
        ];
        for (const [label, value] of totals) {
            page.drawText(label, { x: 390, y, size: 9, font: label === "Total:" || label === "Due:" ? bold : font });
            page.drawText(value, { x: 500, y, size: 9, font: label === "Total:" || label === "Due:" ? bold : font });
            y -= 17;
        }
        page.drawText(`In words: ${money(invoice.totalAmount)} BDT`, { x: margin, y: y - 10, size: 9, font });
        if (signature) page.drawImage(signature, { x: 405, y: 95, width: 120, height: 45 });
        page.drawLine({ start: { x: 40, y: 90 }, end: { x: 190, y: 90 }, thickness: 0.75, color: rgb(0.6, 0.6, 0.6) });
        page.drawText("Prepared By", { x: 40, y: 76, size: 9, font: bold });
        return Buffer.from(await pdf.save());
    }
}
