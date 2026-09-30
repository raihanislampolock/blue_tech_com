import fs from "fs";
import path from "path";
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

    public async generatePdf(id: number): Promise<{ pdfBuffer: Buffer; emailSent?: boolean }> {
        try {
            const invoice = await this.edit(id);
            if (!invoice) throw new Error('Invoice not found');

            const itemsWithDetails = invoice.items || [];

            // Financial Calculations
            const subtotal = Number(invoice.subtotal) || itemsWithDetails.reduce((sum: number, item: any) => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.unitPrice) || 0;
                return sum + (qty * price);
            }, 0);

            const discountAmount = Number(invoice.discountAmount) || 0;
            const taxAmount = Number(invoice.taxAmount) || 0;
            const totalAmount = Number(invoice.totalAmount) || (subtotal - discountAmount + taxAmount);
            const advanceAmountApplied = Number(invoice.advanceAmountApplied) || 0;
            const paidAmount = Number(invoice.paidAmount) || 0;
            const dueAmount = Number(invoice.dueAmount) || (totalAmount - advanceAmountApplied - paidAmount);

            const pdfDoc = await PDFDocument.create();

            // Safe Image Loader
            const loadImage = async (relativePath: string) => {
                try {
                    const absolutePath = path.join(process.cwd(), relativePath);
                    if (!fs.existsSync(absolutePath)) return null;
                    
                    const bytes = fs.readFileSync(absolutePath);
                    return await pdfDoc.embedPng(bytes);
                } catch {
                    return null;
                }
            };

            const headerImage = await loadImage('src/public/dist/img/header.png');
            const footerImage = await loadImage('src/public/dist/img/footer.png');
            const signatureImage = await loadImage('src/public/dist/img/rms-sig.png');

            const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            // Page Specs
            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;
            const margin = 40;
            const HEADER_HEIGHT = 85;
            const FOOTER_HEIGHT = 65;
            const BOTTOM_LIMIT = FOOTER_HEIGHT + 110;

            let page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
            let yPosition = A4_HEIGHT - HEADER_HEIGHT - 30;

            // X-Coordinate mapping for grid columns
            const colX = {
                start: margin,
                slEnd: margin + 35,
                descEnd: margin + 300,
                qtyEnd: margin + 350,
                priceEnd: margin + 435,
                amountEnd: A4_WIDTH - margin,
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
                if (headerImage) targetPage.drawImage(headerImage, { x: 0, y: A4_HEIGHT - HEADER_HEIGHT, width: A4_WIDTH, height: HEADER_HEIGHT });
                if (footerImage) targetPage.drawImage(footerImage, { x: 0, y: 0, width: A4_WIDTH, height: FOOTER_HEIGHT });
            };

            const addPage = () => {
                page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
                drawHeaderFooter();
                yPosition = A4_HEIGHT - HEADER_HEIGHT - 40;
            };

            drawHeaderFooter();

            // --- TITLE SECTION ---
            page.drawText('Blue Tech Solutions', { x: margin, y: yPosition, size: 20, font: helveticaBold, color: rgb(0.11, 0.16, 0.23) });
            page.drawText('SALES INVOICE', { x: margin, y: yPosition - 22, size: 11, font: helveticaBold, color: rgb(0.44, 0.5, 0.59) });

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
                page.drawText(value, { x: boxX + 80, y: currentY, size: 9, font: helvetica, color: rgb(0.1, 0.1, 0.1) });
            };

            const customerName = invoice.customerNameSnapshot || invoice.customer?.customerName || 'N/A';
            const customerPhone = invoice.customerPhoneSnapshot || invoice.customer?.phoneNumber || 'N/A';

            drawMetaLine('Invoice No:', invoice.invoiceNumber || 'N/A', boxY + 65);
            drawMetaLine('Date:', invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString(), boxY + 49);
            drawMetaLine('Customer:', customerName.length > 20 ? customerName.substring(0, 18) + '...' : customerName, boxY + 33);
            drawMetaLine('Phone:', customerPhone, boxY + 17);

            yPosition = boxY - 30;

            if (invoice.notes) {
                page.drawText('Notes / Instructions:', { x: margin, y: yPosition, size: 10, font: helveticaBold });
                yPosition -= 14;
                const wrappedNotes = wrapTextByWidth(invoice.notes, A4_WIDTH - (margin * 2), helvetica, 9);
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

                // Background fill
                page.drawRectangle({
                    x: margin, y: bottomY, width: A4_WIDTH - (margin * 2), height: headerHeight,
                    color: rgb(0.92, 0.94, 0.96),
                });

                // Outer Frame Lines
                page.drawLine({ start: { x: colX.start, y: topY }, end: { x: colX.amountEnd, y: topY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.start, y: bottomY }, end: { x: colX.amountEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });

                // Vertical Column Grid Dividers
                page.drawLine({ start: { x: colX.start, y: topY }, end: { x: colX.start, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.slEnd, y: topY }, end: { x: colX.slEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.descEnd, y: topY }, end: { x: colX.descEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.qtyEnd, y: topY }, end: { x: colX.qtyEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.priceEnd, y: topY }, end: { x: colX.priceEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
                page.drawLine({ start: { x: colX.amountEnd, y: topY }, end: { x: colX.amountEnd, y: bottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });

                // Text Labels
                const textY = bottomY + 6;
                page.drawText('SL', { x: colX.start + 8, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
                page.drawText('Item Description', { x: colX.slEnd + 10, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
                page.drawText('Qty', { x: colX.descEnd + 10, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
                page.drawText('Unit Price', { x: colX.qtyEnd + 10, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });
                page.drawText('Amount', { x: colX.priceEnd + 10, y: textY, size: 9, font: helveticaBold, color: rgb(0.1, 0.1, 0.1) });

                yPosition = bottomY - 14;
            };

            drawTableHeader();

            // --- LINE ITEMS GRID LOOP ---
            for (let i = 0; i < itemsWithDetails.length; i++) {
                const item: any = itemsWithDetails[i];
                const qty = Number(item.quantity) || 0;
                const unitPrice = Number(item.unitPrice) || 0;
                const amount = Number(item.totalPrice) || (qty * unitPrice);

                let itemName = item.itemNameSnapshot || item.item?.itemName || item.itemName || 'Item';
                if (item.description) {
                    itemName += '\n' + item.description;
                }

                const wrappedLines = wrapTextByWidth(itemName, 245, helvetica, 9);
                const rowHeight = Math.max(wrappedLines.length * 13 + 12, 24);

                if (yPosition < BOTTOM_LIMIT + rowHeight) {
                    addPage();
                    drawTableHeader();
                }

                const topY = yPosition + 14;
                const bottomY = topY - rowHeight;
                const textBaselineY = topY - 14;

                // Vertical Intersections
                page.drawLine({ start: { x: colX.start, y: topY }, end: { x: colX.start, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.slEnd, y: topY }, end: { x: colX.slEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.descEnd, y: topY }, end: { x: colX.descEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.qtyEnd, y: topY }, end: { x: colX.qtyEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.priceEnd, y: topY }, end: { x: colX.priceEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });
                page.drawLine({ start: { x: colX.amountEnd, y: topY }, end: { x: colX.amountEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });

                // Base Row Line
                page.drawLine({ start: { x: colX.start, y: bottomY }, end: { x: colX.amountEnd, y: bottomY }, thickness: 0.75, color: rgb(0.74, 0.76, 0.79) });

                // Serial Number
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

            // --- TOTALS & PAYMENTS BREAKDOWN BLOCK ---
            const totalRows = [
                { label: 'Subtotal:', value: subtotal, isBold: false },
                { label: 'Discount:', value: discountAmount, isBold: false },
                { label: 'Tax:', value: taxAmount, isBold: false },
                { label: 'Total Amount:', value: totalAmount, isBold: true },
                { label: 'Advance Applied:', value: advanceAmountApplied, isBold: false },
                { label: 'Paid Amount:', value: paidAmount, isBold: false },
                { label: 'Due Amount:', value: dueAmount, isBold: true, color: rgb(0.75, 0.15, 0.15) }
            ];

            const totalRowHeight = 18;
            const totalBlockHeight = totalRows.length * totalRowHeight;

            if (yPosition < BOTTOM_LIMIT + totalBlockHeight) {
                addPage();
            }

            const blockTopY = yPosition + 14;
            const blockBottomY = blockTopY - totalBlockHeight;

            // Outer Borders for Totals
            page.drawLine({ start: { x: colX.qtyEnd, y: blockTopY }, end: { x: colX.amountEnd, y: blockTopY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
            page.drawLine({ start: { x: colX.qtyEnd, y: blockBottomY }, end: { x: colX.amountEnd, y: blockBottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
            page.drawLine({ start: { x: colX.qtyEnd, y: blockTopY }, end: { x: colX.qtyEnd, y: blockBottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
            page.drawLine({ start: { x: colX.priceEnd, y: blockTopY }, end: { x: colX.priceEnd, y: blockBottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });
            page.drawLine({ start: { x: colX.amountEnd, y: blockTopY }, end: { x: colX.amountEnd, y: blockBottomY }, thickness: 1, color: rgb(0.7, 0.73, 0.77) });

            totalRows.forEach((row, index) => {
                const currentLineY = blockTopY - ((index + 1) * totalRowHeight) + 5;
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

            // Fixed Dual Signature Alignment
            const fixedSignatureY = 98;

            // Column Left: Prepared By
            const leftSignX = margin;
            page.drawLine({ start: { x: leftSignX, y: fixedSignatureY }, end: { x: leftSignX + 150, y: fixedSignatureY }, thickness: 0.75, color: rgb(0.6, 0.6, 0.6) });
            page.drawText('Prepared By', { x: leftSignX, y: fixedSignatureY - 14, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
            page.drawText(invoice.username || "System User", { x: leftSignX, y: fixedSignatureY - 26, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4) });

            // Column Right: Authorized Signature
            const rightSignX = A4_WIDTH - margin - 150;

            if (signatureImage) {
                page.drawImage(signatureImage, {
                    x: rightSignX + 1,
                    y: fixedSignatureY + 5,
                    width: 95,
                    height: 40,
                });
            }

            page.drawLine({ start: { x: rightSignX, y: fixedSignatureY }, end: { x: rightSignX + 150, y: fixedSignatureY }, thickness: 0.75, color: rgb(0.6, 0.6, 0.6) });
            page.drawText('Authorized Signature', { x: rightSignX, y: fixedSignatureY - 14, size: 9, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
            page.drawText('Blue Tech Solutions', { x: rightSignX, y: fixedSignatureY - 26, size: 9, font: helvetica, color: rgb(0.4, 0.4, 0.4) });

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
