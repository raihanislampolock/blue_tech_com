import { Config } from "../../../core/Config";
import fs from "fs";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { IBlueTechPurchaseOrder, IBlueTechPurchaseOrderItem, IBlueTechPurchaseOrderRepository } from "../interfaces/blue_tech_purchase_order_interface";
import { AppDataSource } from "../../../init";
import { BlueTechPurchaseOrderRepository } from "../repositories/blue_tech_purchase_order_repository";

export class BlueTechPurchaseOrderService {
    private blueTechPurchaseOrderRepository: IBlueTechPurchaseOrderRepository;

    constructor(blueTechPurchaseOrderRepository: IBlueTechPurchaseOrderRepository) {
        this.blueTechPurchaseOrderRepository = blueTechPurchaseOrderRepository;
    }

    // ===============================
    // ✅ CREATE
    // ===============================
    public async create(data: Partial<IBlueTechPurchaseOrder>): Promise<IBlueTechPurchaseOrder> {
        try {

            // ✅ VALIDATION (important)
            if (!data.purchaseOrderNumber) {
                throw new Error("Purchase Order number is required");
            }

            if (!data.items || data.items.length === 0) {
                throw new Error("At least one item is required");
            }

            // 👉 Now TypeScript knows it's safe
            return await this.blueTechPurchaseOrderRepository.create(data as IBlueTechPurchaseOrder);

        } catch (error) {
            console.error("Create Purchase Order Error:", error);
            throw new Error("Failed to create purchase order");
        }
    }

    // ===============================
    // ✅ GET ALL
    // ===============================
    public async getAll(
        searchStr: string,
        page: number,
        limit: number
    ) {
        try {
            return await this.blueTechPurchaseOrderRepository.getAll(searchStr, page, limit);
        } catch (error) {
            console.error("Fetch Purchase Order Error:", error);
            throw new Error("Failed to fetch purchase orders");
        }
    }

    // ===============================
    // ✅ EDIT
    // ===============================
    public async edit(id: number): Promise<IBlueTechPurchaseOrder | null> {
        try {
            return await this.blueTechPurchaseOrderRepository.edit(id);
        } catch (error) {
            console.error("Edit Purchase Order Error:", error);
            throw new Error("Failed to fetch purchase order");
        }
    }

    // ===============================
    // 🔥 UPDATE (REPO HANDLES STOCK)
    // ===============================
    public async update(
        id: number,
        data: Partial<IBlueTechPurchaseOrder>,
        items: IBlueTechPurchaseOrderItem[]
    ): Promise<any> {
        try {

            // 🔥 Merge items into data (important)
            const payload = {
                ...data,
                items
            };

            return await this.blueTechPurchaseOrderRepository.update(id, payload);

        } catch (error) {
            console.error("Update Purchase Order Error:", error);
            throw new Error("Failed to update purchase order");
        }
    }

    public async recordSupplierAdvance(data: any): Promise<any> {
        return this.blueTechPurchaseOrderRepository.recordSupplierAdvance(data);
    }

    public async getSupplierAdvanceBalance(supplierName: string): Promise<any> {
        return this.blueTechPurchaseOrderRepository.getSupplierAdvanceBalance(supplierName);
    }


    // ===============================
    // ✅ DROPDOWN
    // ===============================
    public async getItemDropdown(): Promise<{ id: string; label: string }[]> {
        try {
            return await this.blueTechPurchaseOrderRepository.getDataByItemId();
        } catch (error) {
            console.error("Dropdown Error:", error);
            throw new Error("Failed to load dropdown");
        }
    }

    public async getSupplierDropdown(): Promise<{ id: string; label: string }[]> {
        try {
            return await this.blueTechPurchaseOrderRepository.getDataBySupplierId();
        } catch (error) {
            console.error("Dropdown Error:", error);
            throw new Error("Failed to load dropdown");
        }
    }

    public async getPaymentMethodDropdown(): Promise<{ id: string; label: string }[]> {
        try {
            return await this.blueTechPurchaseOrderRepository.getDataByPaymentMethodId();
        } catch (error) {
            console.error("Dropdown Error:", error);
            throw new Error("Failed to load dropdown");
        }
    }

    // ===============================
    // 🔢 PURCHASE NUMBER
    // ===============================
    public async generatePurchaseOrderNumber(supplierCode: string): Promise<string> {
        try {
            const result = await AppDataSource.query(`
                SELECT
                CONCAT(
                    'PUR/',
                    TO_CHAR(NOW(), 'YYYYMM'),
                    '/',
                    $1::text,
                    '-',
                    LPAD(nextval('blue_tech_purchase_order_seq')::text, 3, '0')
                ) AS "purchaseOrderNumber"
            `, [supplierCode]);

            return result[0].purchaseOrderNumber;
        } catch (error) {
            console.error("Generate Number Error:", error);
            throw new Error("Failed to generate purchase order number");
        }
    }

    // ===============================
    // 📄 GENERATE PDF
    // ===============================
    public async generatePdf(id: number): Promise<{ pdfBuffer: Buffer; emailSent?: boolean }> {
        try {
            const purchase = await this.edit(id);
            if (!purchase) throw new Error('Purchase Order not found');

            const itemsWithDetails = purchase.items || [];

            const totalAmount = itemsWithDetails.reduce((sum, item: any) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                return sum + qty * price;
            }, 0);

            // Extract and parse financial payment amounts from query/object
            const advancePayment = Number(purchase.advancePayment) || 0;
            const settledPayment = Number(purchase.settledPayment) || 0;
            const duePayment = Number(purchase.duePayment) || 0;

            const pdfDoc = await PDFDocument.create();

            // Load header and footer images
            const headerImageBytes = fs.readFileSync('src/public/dist/img/header.png');
            const footerImageBytes = fs.readFileSync('src/public/dist/img/footer.png');
            const signatureBytes = fs.readFileSync('src/public/dist/img/rms-sig.png');

            const headerImage = await pdfDoc.embedPng(headerImageBytes);
            const footerImage = await pdfDoc.embedPng(footerImageBytes);
            const signatureImage = await pdfDoc.embedPng(signatureBytes);

            const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // --- A4 PAGE CONFIGURATION ---
            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;

            const margin = 40;
            const HEADER_HEIGHT = 85;
            const FOOTER_HEIGHT = 65;
            const BOTTOM_LIMIT = FOOTER_HEIGHT + 110; // Extra room for the new dual-column signatures

            let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
            let yPosition = A4_HEIGHT - HEADER_HEIGHT - 30;

            // X-Coordinate mapping for Excel column borders
            const colX = {
                start: margin,
                slEnd: margin + 35,
                descEnd: margin + 300,
                qtyEnd: margin + 350,
                priceEnd: margin + 435,
                amountEnd: A4_WIDTH - margin
            };

            const cleanText = (text: any): string => {
                return String(text || '')
                    .replace(/\r/g, '')
                    .replace(/\t/g, ' ')
                    .replace(/[^\x20-\x7E\n]/g, '');
            };

            const wrapTextByWidth = (text: string, maxWidth: number, font: any, fontSize: number): string[] => {
                const safeText = cleanText(text);
                const paragraphs = safeText.split('\n');
                const lines: string[] = [];

                for (const paragraph of paragraphs) {
                    const words = paragraph.split(' ');
                    let line = '';

                    for (const word of words) {
                        const testLine = line ? line + ' ' + word : word;
                        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

                        if (testWidth > maxWidth) {
                            if (line) lines.push(line);
                            line = word;
                        } else {
                            line = testLine;
                        }
                    }
                    if (line) lines.push(line);
                }
                return lines;
            };

            const drawHeaderFooter = (targetPage = page) => {
                targetPage.drawImage(headerImage, { x: 0, y: A4_HEIGHT - HEADER_HEIGHT, width: A4_WIDTH, height: HEADER_HEIGHT });
                targetPage.drawImage(footerImage, { x: 0, y: 0, width: A4_WIDTH, height: FOOTER_HEIGHT });
            };

            const addPage = () => {
                page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
                drawHeaderFooter();
                yPosition = A4_HEIGHT - HEADER_HEIGHT - 40;
            };

            drawHeaderFooter();

            // --- TITLE SECTION ---
            page.drawText('Blue Tech Solutions', { x: margin, y: yPosition, size: 20, font: helveticaBold, color: rgb(0.11, 0.16, 0.23) });
            page.drawText('PURCHASE Order ITEMS', { x: margin, y: yPosition - 22, size: 11, font: helveticaBold, color: rgb(0.44, 0.5, 0.59) });

            // --- METADATA BOX ---
            const boxWidth = 200;
            const boxHeight = 85;
            const boxX = A4_WIDTH - margin - boxWidth;
            const boxY = yPosition - 65;

            page.drawRectangle({
                x: boxX, y: boxY, width: boxWidth, height: boxHeight,
                borderColor: rgb(0.88, 0.91, 0.94), borderWidth: 1, color: rgb(0.98, 0.98, 0.99),
            });

            const drawMetaLine = (label: string, value: string, currentY: number) => {
                page.drawText(label, { x: boxX + 12, y: currentY, size: 9, font: helveticaBold, color: rgb(0.3, 0.3, 0.3) });
                page.drawText(value, { x: boxX + 90, y: currentY, size: 9, font: helvetica, color: rgb(0.1, 0.1, 0.1) });
            };

            drawMetaLine('PO Number:', purchase.purchaseOrderNumber || 'N/A', boxY + 65);
            drawMetaLine('Date:', new Date().toLocaleDateString(), boxY + 49);
            drawMetaLine('Supplier:', purchase.supplierName || 'N/A', boxY + 33);
            // drawMetaLine('Email:', purchase.supplierEmail ? (purchase.supplierEmail.length > 18 ? purchase.supplierEmail.substring(0,20)+'...' : purchase.supplierEmail) : 'N/A', boxY + 17);

            yPosition = boxY - 30;

            if (purchase.notes) {
                page.drawText('Notes / Instructions:', { x: margin, y: yPosition, size: 10, font: helveticaBold });
                yPosition -= 14;
                const wrappedNotes = wrapTextByWidth(purchase.notes, A4_WIDTH - (margin * 2), helvetica, 9);
                for (const line of wrappedNotes) {
                    if (yPosition < BOTTOM_LIMIT) addPage();
                    page.drawText(line, { x: margin, y: yPosition, size: 9, font: helvetica, color: rgb(0.2, 0.2, 0.2) });
                    yPosition -= 12;
                }
                yPosition -= 10;
            }

            // --- EXCEL-STYLE TABLE HEADER ---
            const drawTableHeader = () => {
                if (yPosition < BOTTOM_LIMIT + 30) addPage();

                const headerHeight = 22;
                const topY = yPosition + 4;
                const bottomY = topY - headerHeight;

                // Gray row background
                page.drawRectangle({
                    x: margin, y: bottomY, width: A4_WIDTH - (margin * 2), height: headerHeight,
                    color: rgb(0.92, 0.94, 0.96),
                });

                // Outer Frame Horizontal Lines
                page.drawLine({ start: { x: colX.start, y: topY }, end: { x: colX.amountEnd, y: topY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.start, y: bottomY }, end: { x: colX.amountEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });

                // Vertical Column Grid Divider Lines
                page.drawLine({ start: { x: colX.start, y: topY }, end: { x: colX.start, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.slEnd, y: topY }, end: { x: colX.slEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.descEnd, y: topY }, end: { x: colX.descEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.qtyEnd, y: topY }, end: { x: colX.qtyEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.priceEnd, y: topY }, end: { x: colX.priceEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.amountEnd, y: topY }, end: { x: colX.amountEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });

                // Text Typography Metrics
                const textY = bottomY + 6;
                page.drawText('SL', { x: colX.start + 8, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
                page.drawText('Item Description', { x: colX.slEnd + 10, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
                page.drawText('Qty', { x: colX.descEnd + 10, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
                page.drawText('Unit Price', { x: colX.qtyEnd + 10, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
                page.drawText('Amount', { x: colX.priceEnd + 10, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });

                yPosition = bottomY - 14;
            };

            drawTableHeader();

            // --- LINE ITEMS EXCEL GRID LOOP ---
            for (let i = 0; i < itemsWithDetails.length; i++) {
                const item: any = itemsWithDetails[i];
                const qty = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const amount = qty * unitPrice;

                let description = item.itemName || '';
                if (item.description) {
                    description += '\n' + item.description;
                }

                // Explicit maximum text boundary limits to avoid grid bleeding
                const wrappedLines = wrapTextByWidth(description, 245, helvetica, 9);
                const rowHeight = Math.max(wrappedLines.length * 13 + 12, 24);

                if (yPosition < BOTTOM_LIMIT + rowHeight) {
                    addPage();
                    drawTableHeader();
                }

                const topY = yPosition + 14;
                const bottomY = topY - rowHeight;
                const textBaselineY = topY - 14;

                // Excel Cell Grid Box Boundaries (Vertical Intersections)
                page.drawLine({ start: { x: colX.start, y: topY }, end: { x: colX.start, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.slEnd, y: topY }, end: { x: colX.slEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.descEnd, y: topY }, end: { x: colX.descEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.qtyEnd, y: topY }, end: { x: colX.qtyEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.priceEnd, y: topY }, end: { x: colX.priceEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.amountEnd, y: topY }, end: { x: colX.amountEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });

                // Base Row Horizontal Line
                page.drawLine({ start: { x: colX.start, y: bottomY }, end: { x: colX.amountEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });

                // Data Text Rendering
                page.drawText(String(i + 1), { x: colX.start + 8, y: textBaselineY, size: 9, font: helvetica });

                const rightAlignText = (text: string, rightBoundX: number) => {
                    const txtWidth = helvetica.widthOfTextAtSize(text, 9);
                    page.drawText(text, { x: rightBoundX - txtWidth - 8, y: textBaselineY, size: 9, font: helvetica });
                };

                rightAlignText(String(qty), colX.qtyEnd);
                rightAlignText(this.formatCurrency(unitPrice), colX.priceEnd);
                rightAlignText(this.formatCurrency(amount), colX.amountEnd);

                let innerTextY = textBaselineY;
                for (const line of wrappedLines) {
                    page.drawText(line, { x: colX.slEnd + 8, y: innerTextY, size: 9, font: helvetica, color: rgb(0.15, 0.15, 0.15) });
                    innerTextY -= 13;
                }

                yPosition = bottomY - 14;
            }

            // --- TOTALS BAR (EXCEL WRAPPED STYLE) ---
            const totalRows = [
                { label: 'Total:', value: totalAmount, isBold: true },
                { label: 'Advance Payment:', value: advancePayment, isBold: false },
                { label: 'Settled Payment:', value: settledPayment, isBold: false },
                { label: 'Due Payment:', value: duePayment, isBold: true, color: rgb(0.75, 0.15, 0.15) }
            ];

            const totalRowHeight = 20;
            const totalBlockHeight = totalRows.length * totalRowHeight;

            if (yPosition < BOTTOM_LIMIT + totalBlockHeight) {
                addPage();
            }

            const blockTopY = yPosition + 14;
            const blockBottomY = blockTopY - totalBlockHeight;

            // Draw outer borders for totals/payments area
            page.drawLine({ start: { x: colX.qtyEnd, y: blockTopY }, end: { x: colX.amountEnd, y: blockTopY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
            page.drawLine({ start: { x: colX.qtyEnd, y: blockBottomY }, end: { x: colX.amountEnd, y: blockBottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
            page.drawLine({ start: { x: colX.qtyEnd, y: blockTopY }, end: { x: colX.qtyEnd, y: blockBottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
            page.drawLine({ start: { x: colX.priceEnd, y: blockTopY }, end: { x: colX.priceEnd, y: blockBottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
            page.drawLine({ start: { x: colX.amountEnd, y: blockTopY }, end: { x: colX.amountEnd, y: blockBottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });

            // Iterate through financial line items
            totalRows.forEach((row, index) => {
                const currentLineY = blockTopY - ((index + 1) * totalRowHeight) + 6;
                const fontToUse = row.isBold ? helveticaBold : helvetica;
                const textColor = row.color || rgb(0.11, 0.16, 0.23);

                if (index < totalRows.length - 1) {
                    const lineDividerY = blockTopY - ((index + 1) * totalRowHeight);
                    page.drawLine({ start: { x: colX.qtyEnd, y: lineDividerY }, end: { x: colX.amountEnd, y: lineDividerY }, thickness: 0.5, color: rgb(0.85, 0.87, 0.9) });
                }

                const formattedVal = this.formatCurrency(row.value);
                const txtWidth = fontToUse.widthOfTextAtSize(formattedVal, 9);

                page.drawText(row.label, { x: colX.qtyEnd + 8, y: currentLineY, size: 9, font: fontToUse, color: textColor });
                page.drawText(formattedVal, { x: colX.amountEnd - txtWidth - 8, y: currentLineY, size: 9, font: fontToUse, color: textColor });
            });

            yPosition = blockBottomY - 15;

            // In Words Segment
            if (yPosition < BOTTOM_LIMIT) addPage();
            page.drawText(`In words: ${this.numberToWords(Math.floor(totalAmount))}.`, {
                x: margin, y: yPosition, size: 9, font: helvetica, color: rgb(0.3, 0.3, 0.3),
            });

            if (yPosition < 140) {
                addPage();
            }

            // Fixed Signature Anchor Point
            const fixedSignatureY = 98;

            // Column Left: Prepared By
            const leftSignX = margin;
            page.drawLine({ start: { x: leftSignX, y: fixedSignatureY }, end: { x: leftSignX + 150, y: fixedSignatureY }, thickness: 0.75, color: rgb(0.6, 0.6, 0.6) });
            page.drawText('Prepared By', { x: leftSignX, y: fixedSignatureY - 14, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
            page.drawText(purchase.username || "System User", { x: leftSignX, y: fixedSignatureY - 26, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4) });

            // Column Right: Authorized Signature
            const rightSignX = A4_WIDTH - margin - 150;

            page.drawImage(signatureImage, {
                x: rightSignX + 1,
                y: fixedSignatureY + 5,
                width: 95,
                height: 40,
            });

            page.drawLine({ start: { x: rightSignX, y: fixedSignatureY }, end: { x: rightSignX + 150, y: fixedSignatureY }, thickness: 0.75, color: rgb(0.6, 0.6, 0.6) });
            page.drawText('Authorized Signature', { x: rightSignX, y: fixedSignatureY - 14, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
            page.drawText('RMS Technologies', { x: rightSignX, y: fixedSignatureY - 26, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4) });

            // Compile Binary Output Buffer
            const pdfBytes = await pdfDoc.save();

            return {
                pdfBuffer: Buffer.from(pdfBytes),
                emailSent: false,
            };

        } catch (error: any) {
            console.error('Error generating PDF:', error);
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }
    }

    private formatCurrency(value: number): string {
        return `${value.toFixed(2)}`;
    }

    private numberToWords(amount: number): string {
        const units = [
            '',
            'One', 'Two', 'Three', 'Four', 'Five',
            'Six', 'Seven', 'Eight', 'Nine'
        ];

        const teens = [
            'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
            'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
        ];

        const tens = [
            '', '', 'Twenty', 'Thirty', 'Forty',
            'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
        ];

        const convertBelow100 = (num: number): string => {
            let text = '';

            if (num >= 20) {
                text += tens[Math.floor(num / 10)] + ' ';
                num %= 10;
            } else if (num >= 10) {
                text += teens[num - 10] + ' ';
                return text.trim();
            }

            if (num > 0) {
                text += units[num] + ' ';
            }

            return text.trim();
        };

        const convertBelow1000 = (num: number): string => {
            let text = '';

            if (num >= 100) {
                text += units[Math.floor(num / 100)] + ' Hundred ';
                num %= 100;
            }

            if (num > 0) {
                text += convertBelow100(num) + ' ';
            }

            return text.trim();
        };

        if (amount === 0) return 'Zero Taka';

        let result = '';

        const crore = Math.floor(amount / 10000000);
        amount %= 10000000;

        const lakh = Math.floor(amount / 100000);
        amount %= 100000;

        const thousand = Math.floor(amount / 1000);
        amount %= 1000;

        const hundredPart = amount;

        if (crore > 0) {
            result += convertBelow1000(crore) + ' Crore ';
        }

        if (lakh > 0) {
            result += convertBelow1000(lakh) + ' Lakh ';
        }

        if (thousand > 0) {
            result += convertBelow1000(thousand) + ' Thousand ';
        }

        if (hundredPart > 0) {
            result += convertBelow1000(hundredPart) + ' ';
        }

        return result.trim() + ' Taka Only';
    }
}