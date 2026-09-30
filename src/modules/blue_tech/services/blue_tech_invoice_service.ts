import fs from "fs";
import path from "path";
import {
    PDFDocument,
    StandardFonts,
    rgb,
    PDFImage,
    PDFPage,
    PDFFont
} from "pdf-lib";

import {
    IBlueTechInvoice,
    IBlueTechInvoiceRepository
} from "../interfaces/blue_tech_invoice_interface";

import { BlueTechInvoiceRepository } from "../repositories/blue_tech_invoice_repository";


export class BlueTechInvoiceService {

    private repository: BlueTechInvoiceRepository;

    constructor(repository: IBlueTechInvoiceRepository) {
        this.repository = repository as BlueTechInvoiceRepository;
    }


    // ============================================================
    // BASIC METHODS
    // ============================================================

    public async create(data: Partial<IBlueTechInvoice>): Promise<any> {

        if (!data.invoiceNumber || !data.customerId || !data.items?.length) {
            throw new Error(
                "Invoice number, customer, and items are required"
            );
        }

        return this.repository.create(data as IBlueTechInvoice);
    }


    public getAll(
        search: string,
        page: number,
        limit: number
    ): Promise<any> {

        return this.repository.getAll(
            search,
            page,
            limit
        );
    }


    public edit(id: number): Promise<any | null> {
        return this.repository.edit(id);
    }


    public update(
        id: number,
        data: IBlueTechInvoice
    ): Promise<any> {

        return this.repository.update(
            id,
            data
        );
    }


    public generateInvoiceNumber(
        customerCode: string
    ): Promise<string> {

        return this.repository.generateInvoiceNumber(
            customerCode
        );
    }


    public recordCustomerAdvance(data: any): Promise<any> {

        return this.repository.recordCustomerAdvance(
            data
        );
    }


    public getCustomerAdvanceBalance(
        customerId: number
    ): Promise<any> {

        return this.repository.getCustomerAdvanceBalance(
            customerId
        );
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


    // ============================================================
    // PDF GENERATION
    // ============================================================

    public async generatePdf(
        id: number
    ): Promise<{
        pdfBuffer: Buffer;
        emailSent?: boolean;
    }> {

        try {

            // ----------------------------------------------------
            // GET INVOICE
            // ----------------------------------------------------

            const invoice = await this.edit(id);

            if (!invoice) {
                throw new Error("Invoice not found");
            }


            const itemsWithDetails = invoice.items || [];


            // ----------------------------------------------------
            // FINANCIAL CALCULATIONS
            // ----------------------------------------------------

            const subtotal =
                Number(invoice.subtotal) ||
                itemsWithDetails.reduce(
                    (sum: number, item: any) => {

                        const quantity =
                            Number(item.quantity) || 0;

                        const unitPrice =
                            Number(item.unitPrice) || 0;

                        return sum +
                            quantity * unitPrice;

                    },
                    0
                );


            const discountAmount =
                Number(invoice.discountAmount) || 0;


            const taxAmount =
                Number(invoice.taxAmount) || 0;


            const totalAmount =
                Number(invoice.totalAmount) ||
                (
                    subtotal -
                    discountAmount +
                    taxAmount
                );


            const advanceAmountApplied =
                Number(invoice.advanceAmountApplied) || 0;


            const paidAmount =
                Number(invoice.paidAmount) || 0;


            /*
             * Calculate due amount.
             *
             * We calculate this ourselves when possible so that
             * the PDF does not accidentally show an incorrect
             * payment status because of a stale database value.
             */

            let dueAmount =
                totalAmount -
                advanceAmountApplied -
                paidAmount;


            /*
             * Avoid values such as:
             *
             * -0.00001
             * 0.0000001
             *
             * in the PDF.
             */

            if (Math.abs(dueAmount) < 0.01) {
                dueAmount = 0;
            }


            /*
             * Payable amount.
             *
             * In your sample invoice:
             *
             * Total Amount
             * Advance Amount
             * Due Amount
             * Payable Amount
             *
             * are displayed separately.
             */

            const payableAmount =
                Math.max(
                    0,
                    dueAmount
                );


            // ----------------------------------------------------
            // PAID / SETTLED CHECK
            // ----------------------------------------------------

            const invoiceStatus =
                String(
                    invoice.invoiceStatus ||
                    invoice.status ||
                    ""
                )
                    .trim()
                    .toUpperCase();


            /*
             * Amount covered by actual customer payments.
             *
             * Advance amount is also considered as money already
             * applied against the invoice.
             */

            const totalCoveredAmount =
                advanceAmountApplied +
                paidAmount;


            /*
             * Invoice is fully settled when:
             *
             * 1. Status is PAID or SETTLED
             *
             * OR
             *
             * 2. The complete invoice amount is covered and
             *    remaining due is zero.
             *
             * This prevents a PAID stamp from appearing on
             * partially paid invoices.
             */

            const isFullyPaid =
                invoiceStatus === "PAID" ||
                invoiceStatus === "SETTLED" ||
                (
                    totalAmount > 0 &&
                    totalCoveredAmount >=
                        totalAmount - 0.01 &&
                    dueAmount <= 0.01
                );


            // ----------------------------------------------------
            // CREATE PDF
            // ----------------------------------------------------

            const pdfDoc =
                await PDFDocument.create();


            // ----------------------------------------------------
            // FONTS
            // ----------------------------------------------------

            const helvetica =
                await pdfDoc.embedFont(
                    StandardFonts.Helvetica
                );


            const helveticaBold =
                await pdfDoc.embedFont(
                    StandardFonts.HelveticaBold
                );


            // ----------------------------------------------------
            // PAGE SETTINGS
            // ----------------------------------------------------

            const A4_WIDTH = 595.28;
            const A4_HEIGHT = 841.89;

            const marginLeft = 38;
            const marginRight = 38;

            const contentWidth =
                A4_WIDTH -
                marginLeft -
                marginRight;


            const HEADER_HEIGHT = 95;
            const FOOTER_HEIGHT = 70;

            const TOP_CONTENT =
                A4_HEIGHT -
                HEADER_HEIGHT -
                20;

            const BOTTOM_CONTENT =
                FOOTER_HEIGHT +
                35;


            let page =
                pdfDoc.addPage([
                    A4_WIDTH,
                    A4_HEIGHT
                ]);


            let yPosition =
                TOP_CONTENT;


            // ====================================================
            // IMAGE LOADER
            // ====================================================

            const loadPng = async (
                filePaths: string[]
            ): Promise<PDFImage | null> => {

                for (const relativePath of filePaths) {

                    try {

                        const absolutePath =
                            path.join(
                                process.cwd(),
                                relativePath
                            );


                        if (
                            !fs.existsSync(
                                absolutePath
                            )
                        ) {
                            continue;
                        }


                        const imageBytes =
                            fs.readFileSync(
                                absolutePath
                            );


                        return await pdfDoc.embedPng(
                            imageBytes
                        );

                    } catch (error) {

                        console.error(
                            `Unable to load image: ${relativePath}`,
                            error
                        );

                    }
                }

                return null;
            };


            // ====================================================
            // YOUR IMAGE FILES
            // ====================================================
            //
            // Keep your existing image names if these are the
            // names in your project.
            //
            // If your Blue Tech images have different names,
            // simply change the paths below.
            //
            // ====================================================

            const headerImage =
                await loadPng([
                    "src/public/dist/img/header.png",
                    "src/public/dist/img/bluetech-header.png",
                    "src/public/dist/img/blue-tech-header.png"
                ]);


            const footerImage =
                await loadPng([
                    "src/public/dist/img/footer.png",
                    "src/public/dist/img/bluetech-footer.png",
                    "src/public/dist/img/blue-tech-footer.png"
                ]);


            const signatureImage =
                await loadPng([
                    "src/public/dist/img/blue-tech-sig.png",
                    "src/public/dist/img/signature.png",
                    "src/public/dist/img/bluetech-signature.png"
                ]);

            const blueTechSealImage =
                await loadPng([
                    "src/public/dist/img/blue_tech_seal.png",
                    "src/public/dist/img/blue-tech-seal.png",
                    "src/public/dist/img/bluetech-seal.png",
                    "src/public/dist/img/blue_tech_stamp.png",
                    "src/public/dist/img/blue-tech-stamp.png"
                ]);    


            /*
             * IMPORTANT:
             *
             * Put your PAID stamp image here.
             *
             * For example:
             *
             * src/public/dist/img/paid.png
             *
             * The image will ONLY be drawn when isFullyPaid
             * is true.
             */

            const paidStampImage =
                await loadPng([
                    "src/public/dist/img/paid.png",
                    "src/public/dist/img/PAID.png",
                    "src/public/dist/img/paid-stamp.png",
                    "src/public/dist/img/paid_stamp.png"
                ]);


            // ====================================================
            // TEXT CLEANER
            // ====================================================

            const cleanText = (
                value: any
            ): string => {

                if (
                    value === null ||
                    value === undefined
                ) {
                    return "";
                }


                return String(value)
                    .replace(/\r/g, "")
                    .replace(/\t/g, " ")
                    .replace(
                        /[^\x20-\x7E\n]/g,
                        ""
                    )
                    .trim();
            };


            // ====================================================
            // TEXT WRAPPING
            // ====================================================

            const wrapText = (
                text: string,
                maxWidth: number,
                font: PDFFont,
                fontSize: number
            ): string[] => {

                const safeText =
                    cleanText(text);


                if (!safeText) {
                    return [""];
                }


                const paragraphs =
                    safeText.split("\n");


                const lines: string[] = [];


                for (
                    const paragraph of paragraphs
                ) {

                    const words =
                        paragraph.split(" ");


                    let line = "";


                    for (
                        const word of words
                    ) {

                        const testLine =
                            line
                                ? `${line} ${word}`
                                : word;


                        const width =
                            font.widthOfTextAtSize(
                                testLine,
                                fontSize
                            );


                        if (
                            width > maxWidth &&
                            line
                        ) {

                            lines.push(line);

                            line = word;

                        } else {

                            line = testLine;

                        }

                    }


                    if (line) {
                        lines.push(line);
                    }

                }


                return lines.length
                    ? lines
                    : [""];
            };


            // ====================================================
            // CURRENCY
            // ====================================================

            const formatCurrency = (
                value: number
            ): string => {

                return Number(
                    value || 0
                ).toLocaleString(
                    "en-US",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );
            };


            // ====================================================
            // DRAW HEADER / FOOTER
            // ====================================================

            const drawHeaderFooter = (
                targetPage: PDFPage
            ) => {

                if (headerImage) {

                    targetPage.drawImage(
                        headerImage,
                        {
                            x: 0,
                            y:
                                A4_HEIGHT -
                                HEADER_HEIGHT,

                            width: A4_WIDTH,

                            height:
                                HEADER_HEIGHT
                        }
                    );

                }


                if (footerImage) {

                    targetPage.drawImage(
                        footerImage,
                        {
                            x: 0,
                            y: 0,

                            width: A4_WIDTH,

                            height:
                                FOOTER_HEIGHT
                        }
                    );

                }

            };


            // Draw first page header/footer
            drawHeaderFooter(page);


            // ====================================================
            // NEW PAGE
            // ====================================================

            const addNewPage = () => {

                page =
                    pdfDoc.addPage([
                        A4_WIDTH,
                        A4_HEIGHT
                    ]);


                drawHeaderFooter(page);


                yPosition =
                    TOP_CONTENT;
            };


            // ====================================================
            // CUSTOMER INFORMATION
            // ====================================================

            const customerName =
                cleanText(
                    invoice.customerNameSnapshot ||
                    invoice.customer?.customerName ||
                    invoice.customer?.name ||
                    "N/A"
                );


            const customerAddress =
                cleanText(
                    invoice.customerAddressSnapshot ||
                    invoice.customer?.billingAddress ||
                    invoice.customerAddress ||
                    ""
                );


            const customerPhone =
                cleanText(
                    invoice.customerPhoneSnapshot ||
                    invoice.customer?.phoneNumber ||
                    invoice.customer?.phone ||
                    ""
                );


            const invoiceNumber =
                cleanText(
                    invoice.invoiceNumber ||
                    "N/A"
                );


            let invoiceDate =
                new Date();


            if (invoice.invoiceDate) {

                const parsedDate =
                    new Date(
                        invoice.invoiceDate
                    );


                if (
                    !Number.isNaN(
                        parsedDate.getTime()
                    )
                ) {

                    invoiceDate =
                        parsedDate;

                }

            }


            const formattedInvoiceDate =
                invoiceDate.toLocaleDateString(
                    "en-GB"
                );


            // ====================================================
            // INVOICE NUMBER / DATE
            // ====================================================

            page.drawText(
                `INV: ${invoiceNumber}`,
                {
                    x: marginLeft,
                    y: yPosition,

                    size: 10,

                    font: helveticaBold,

                    color:
                        rgb(
                            0.10,
                            0.10,
                            0.10
                        )
                }
            );


            page.drawText(
                `Date: ${formattedInvoiceDate}`,
                {
                    x:
                        A4_WIDTH -
                        marginRight -
                        105,

                    y: yPosition,

                    size: 10,

                    font: helvetica,

                    color:
                        rgb(
                            0.10,
                            0.10,
                            0.10
                        )
                }
            );


            yPosition -= 20;


            // ====================================================
            // TO
            // ====================================================

            page.drawText(
                "To,",
                {
                    x: marginLeft,
                    y: yPosition,

                    size: 10,

                    font: helveticaBold,

                    color:
                        rgb(
                            0.10,
                            0.10,
                            0.10
                        )
                }
            );


            yPosition -= 15;


            page.drawText(
                customerName,
                {
                    x: marginLeft,
                    y: yPosition,

                    size: 10,

                    font: helveticaBold,

                    color:
                        rgb(
                            0.10,
                            0.10,
                            0.10
                        )
                }
            );


            yPosition -= 14;


            if (customerAddress) {

                const addressLines =
                    wrapText(
                        customerAddress,
                        330,
                        helvetica,
                        9
                    );


                for (
                    const line
                    of addressLines
                ) {

                    page.drawText(
                        line,
                        {
                            x: marginLeft,
                            y: yPosition,

                            size: 9,

                            font: helvetica,

                            color:
                                rgb(
                                    0.15,
                                    0.15,
                                    0.15
                                )
                        }
                    );


                    yPosition -= 12;
                }

            }


            if (customerPhone) {

                page.drawText(
                    `Phone: ${customerPhone}`,
                    {
                        x: marginLeft,
                        y: yPosition,

                        size: 9,

                        font: helvetica,

                        color:
                            rgb(
                                0.15,
                                0.15,
                                0.15
                            )
                    }
                );


                yPosition -= 12;

            }


            yPosition -= 15;


            // ====================================================
            // INVOICE TITLE
            // ====================================================

            const invoiceTitle =
                "Invoice";


            const titleWidth =
                helveticaBold.widthOfTextAtSize(
                    invoiceTitle,
                    18
                );


            page.drawText(
                invoiceTitle,
                {
                    x:
                        (
                            A4_WIDTH -
                            titleWidth
                        ) / 2,

                    y: yPosition,

                    size: 18,

                    font: helveticaBold,

                    color:
                        rgb(
                            0.08,
                            0.08,
                            0.08
                        )
                }
            );


            yPosition -= 28;


            // ====================================================
            // TABLE COLUMN WIDTHS
            // ====================================================

            const tableX =
                marginLeft;


            const tableWidth =
                contentWidth;


            /*
             * Columns based on your sample:
             *
             * SL No
             * Item Name
             * Ram/Rom
             * IMEI No
             * Quantity
             * Unit Price
             * Total Amount
             */

            const colWidths = [
                32,   // SL
                125,  // Item
                70,   // RAM/ROM
                75,   // IMEI
                42,   // Qty
                75,   // Unit Price
                76    // Total
            ];


            const colX: number[] = [
                tableX
            ];


            for (
                let i = 0;
                i < colWidths.length;
                i++
            ) {

                colX.push(
                    colX[i] +
                    colWidths[i]
                );

            }


            // Safety
            if (
                Math.abs(
                    colX[colX.length - 1] -
                    (tableX + tableWidth)
                ) > 2
            ) {
                console.warn(
                    "Invoice table width mismatch"
                );
            }


            // ====================================================
            // TABLE HEADER
            // ====================================================

            const drawTableHeader = () => {

                const headerHeight = 30;


                if (
                    yPosition <
                    BOTTOM_CONTENT +
                    headerHeight +
                    40
                ) {

                    addNewPage();

                }


                const topY =
                    yPosition;


                const bottomY =
                    topY -
                    headerHeight;


                // Header background

                page.drawRectangle(
                    {
                        x: tableX,
                        y: bottomY,

                        width: tableWidth,

                        height: headerHeight,

                        color:
                            rgb(
                                0.94,
                                0.94,
                                0.94
                            ),

                        borderColor:
                            rgb(
                                0.30,
                                0.30,
                                0.30
                            ),

                        borderWidth: 1
                    }
                );


                // Vertical lines

                for (
                    let i = 0;
                    i < colX.length;
                    i++
                ) {

                    page.drawLine(
                        {
                            start: {
                                x: colX[i],
                                y: topY
                            },

                            end: {
                                x: colX[i],
                                y: bottomY
                            },

                            thickness: 0.75,

                            color:
                                rgb(
                                    0.30,
                                    0.30,
                                    0.30
                                )
                        }
                    );

                }


                const headers = [
                    "SL No",
                    "Item Name",
                    "Ram/Rom",
                    "IMEI No",
                    "Quantity",
                    "Unit Price",
                    "Total Amount"
                ];


                headers.forEach(
                    (
                        header,
                        index
                    ) => {

                        const fontSize = 7.5;


                        const textWidth =
                            helveticaBold.widthOfTextAtSize(
                                header,
                                fontSize
                            );


                        const centerX =
                            colX[index] +
                            (
                                colWidths[index] -
                                textWidth
                            ) / 2;


                        page.drawText(
                            header,
                            {
                                x: centerX,

                                y:
                                    bottomY +
                                    10,

                                size: fontSize,

                                font:
                                    helveticaBold,

                                color:
                                    rgb(
                                        0.08,
                                        0.08,
                                        0.08
                                    )
                            }
                        );

                    }
                );


                yPosition =
                    bottomY;
            };


            drawTableHeader();


            // ====================================================
            // ITEM FIELD HELPERS
            // ====================================================

            const getRamRom = (
                item: any
            ): string => {

                /*
                 * Supports several possible property names
                 * because different invoice item implementations
                 * may use different names.
                 */

                return cleanText(
                    item.ramRom ||
                    item.ramROM ||
                    item.ramrom ||
                    item.ramAndRom ||
                    item.itemRamRom ||
                    item.item?.ramRom ||
                    item.item?.ramROM ||
                    item.item?.itemConfigurations ||
                    item.itemConfigurations ||
                    "-"
                );
            };


            const getImei = (
                item: any
            ): string => {

                return cleanText(
                    item.imeiNumber ||
                    item.imei ||
                    item.imeiNo ||
                    item.imei_number ||
                    item.itemImei ||
                    "-"
                );
            };


            const getItemName = (
                item: any
            ): string => {

                return cleanText(
                    item.itemNameSnapshot ||
                    item.itemName ||
                    item.item?.itemName ||
                    item.item?.name ||
                    "Item"
                );
            };


            // ====================================================
            // DRAW TABLE ROW
            // ====================================================

            for (
                let i = 0;
                i < itemsWithDetails.length;
                i++
            ) {

                const item =
                    itemsWithDetails[i];


                const quantity =
                    Number(
                        item.quantity
                    ) || 0;


                const unitPrice =
                    Number(
                        item.unitPrice
                    ) || 0;


                const amount =
                    Number(
                        item.totalPrice
                    ) ||
                    (
                        quantity *
                        unitPrice
                    );


                const itemName =
                    getItemName(item);


                const ramRom =
                    getRamRom(item);


                const imei =
                    getImei(item);


                // --------------------------------------------
                // WRAP TEXT
                // --------------------------------------------

                const itemLines =
                    wrapText(
                        itemName,
                        colWidths[1] - 8,
                        helvetica,
                        8
                    );


                const ramRomLines =
                    wrapText(
                        ramRom,
                        colWidths[2] - 8,
                        helvetica,
                        7.5
                    );


                const imeiLines =
                    wrapText(
                        imei,
                        colWidths[3] - 8,
                        helvetica,
                        7.5
                    );


                const maxLines =
                    Math.max(
                        itemLines.length,
                        ramRomLines.length,
                        imeiLines.length,
                        1
                    );


                const rowHeight =
                    Math.max(
                        28,
                        (
                            maxLines *
                            11
                        ) + 12
                    );


                // --------------------------------------------
                // NEW PAGE IF REQUIRED
                // --------------------------------------------

                if (
                    yPosition -
                    rowHeight <
                    BOTTOM_CONTENT
                ) {

                    addNewPage();

                    drawTableHeader();

                }


                const topY =
                    yPosition;


                const bottomY =
                    topY -
                    rowHeight;


                // --------------------------------------------
                // ROW BORDER
                // --------------------------------------------

                page.drawRectangle(
                    {
                        x: tableX,
                        y: bottomY,

                        width: tableWidth,

                        height: rowHeight,

                        borderColor:
                            rgb(
                                0.35,
                                0.35,
                                0.35
                            ),

                        borderWidth: 0.7
                    }
                );


                // --------------------------------------------
                // VERTICAL LINES
                // --------------------------------------------

                for (
                    let j = 1;
                    j < colX.length - 1;
                    j++
                ) {

                    page.drawLine(
                        {
                            start: {
                                x: colX[j],
                                y: topY
                            },

                            end: {
                                x: colX[j],
                                y: bottomY
                            },

                            thickness: 0.6,

                            color:
                                rgb(
                                    0.45,
                                    0.45,
                                    0.45
                                )
                        }
                    );

                }


                // --------------------------------------------
                // TEXT BASELINE
                // --------------------------------------------

                const textY =
                    topY -
                    14;


                // --------------------------------------------
                // SL NO
                // --------------------------------------------

                const slText =
                    String(
                        i + 1
                    );


                const slWidth =
                    helvetica.widthOfTextAtSize(
                        slText,
                        8
                    );


                page.drawText(
                    slText,
                    {
                        x:
                            colX[0] +
                            (
                                colWidths[0] -
                                slWidth
                            ) / 2,

                        y: textY,

                        size: 8,

                        font: helvetica
                    }
                );


                // --------------------------------------------
                // ITEM NAME
                // --------------------------------------------

                let itemTextY =
                    textY;


                for (
                    const line
                    of itemLines
                ) {

                    page.drawText(
                        line,
                        {
                            x:
                                colX[1] +
                                4,

                            y:
                                itemTextY,

                            size: 8,

                            font: helvetica
                        }
                    );


                    itemTextY -= 11;
                }


                // --------------------------------------------
                // RAM / ROM
                // --------------------------------------------

                let ramRomTextY =
                    textY;


                for (
                    const line
                    of ramRomLines
                ) {

                    const width =
                        helvetica.widthOfTextAtSize(
                            line,
                            7.5
                        );


                    page.drawText(
                        line,
                        {
                            x:
                                colX[2] +
                                (
                                    colWidths[2] -
                                    width
                                ) / 2,

                            y:
                                ramRomTextY,

                            size: 7.5,

                            font: helvetica
                        }
                    );


                    ramRomTextY -= 11;
                }


                // --------------------------------------------
                // IMEI
                // --------------------------------------------

                let imeiTextY =
                    textY;


                for (
                    const line
                    of imeiLines
                ) {

                    const width =
                        helvetica.widthOfTextAtSize(
                            line,
                            7.5
                        );


                    page.drawText(
                        line,
                        {
                            x:
                                colX[3] +
                                (
                                    colWidths[3] -
                                    width
                                ) / 2,

                            y:
                                imeiTextY,

                            size: 7.5,

                            font: helvetica
                        }
                    );


                    imeiTextY -= 11;
                }


                // --------------------------------------------
                // QUANTITY
                // --------------------------------------------

                const quantityText =
                    String(quantity);


                const quantityWidth =
                    helvetica.widthOfTextAtSize(
                        quantityText,
                        8
                    );


                page.drawText(
                    quantityText,
                    {
                        x:
                            colX[4] +
                            (
                                colWidths[4] -
                                quantityWidth
                            ) / 2,

                        y: textY,

                        size: 8,

                        font: helvetica
                    }
                );


                // --------------------------------------------
                // UNIT PRICE
                // --------------------------------------------

                const unitPriceText =
                    formatCurrency(
                        unitPrice
                    );


                const unitPriceWidth =
                    helvetica.widthOfTextAtSize(
                        unitPriceText,
                        7.5
                    );


                page.drawText(
                    unitPriceText,
                    {
                        x:
                            colX[5] +
                            colWidths[5] -
                            unitPriceWidth -
                            4,

                        y: textY,

                        size: 7.5,

                        font: helvetica
                    }
                );


                // --------------------------------------------
                // TOTAL AMOUNT
                // --------------------------------------------

                const amountText =
                    formatCurrency(
                        amount
                    );


                const amountWidth =
                    helvetica.widthOfTextAtSize(
                        amountText,
                        7.5
                    );


                page.drawText(
                    amountText,
                    {
                        x:
                            colX[6] +
                            colWidths[6] -
                            amountWidth -
                            4,

                        y: textY,

                        size: 7.5,

                        font: helvetica
                    }
                );


                yPosition =
                    bottomY;
            }


            // ====================================================
            // PAYMENT SUMMARY
            // ====================================================

            yPosition -= 18;


            const summaryWidth = 245;

            const summaryX =
                A4_WIDTH -
                marginRight -
                summaryWidth;


            const summaryRowHeight = 18;


            const summaryRows = [
                {
                    label: "Total Amount",
                    value: totalAmount
                },
                {
                    label: "Advance Amount",
                    value: advanceAmountApplied
                },
                {
                    label: "Due Amount",
                    value: dueAmount
                },
                {
                    label: "Payable Amount",
                    value: payableAmount
                }
            ];


            const summaryHeight =
                summaryRows.length *
                summaryRowHeight;


            if (
                yPosition -
                summaryHeight <
                BOTTOM_CONTENT + 80
            ) {

                addNewPage();

            }


            const summaryTop =
                yPosition;


            const summaryBottom =
                summaryTop -
                summaryHeight;


            // Summary outer border

            page.drawRectangle(
                {
                    x: summaryX,

                    y: summaryBottom,

                    width: summaryWidth,

                    height: summaryHeight,

                    borderColor:
                        rgb(
                            0.35,
                            0.35,
                            0.35
                        ),

                    borderWidth: 0.8
                }
            );


            summaryRows.forEach(
                (
                    row,
                    index
                ) => {

                    const rowTop =
                        summaryTop -
                        (
                            index *
                            summaryRowHeight
                        );


                    const rowBottom =
                        rowTop -
                        summaryRowHeight;


                    if (
                        index <
                        summaryRows.length - 1
                    ) {

                        page.drawLine(
                            {
                                start: {
                                    x: summaryX,
                                    y: rowBottom
                                },

                                end: {
                                    x:
                                        summaryX +
                                        summaryWidth,

                                    y: rowBottom
                                },

                                thickness: 0.5,

                                color:
                                    rgb(
                                        0.65,
                                        0.65,
                                        0.65
                                    )
                            }
                        );

                    }


                    const bold =
                        index === 0 ||
                        index ===
                            summaryRows.length - 1;


                    const font =
                        bold
                            ? helveticaBold
                            : helvetica;


                    const valueText =
                        formatCurrency(
                            row.value
                        );


                    page.drawText(
                        row.label,
                        {
                            x:
                                summaryX +
                                8,

                            y:
                                rowBottom +
                                5,

                            size: 8.5,

                            font
                        }
                    );


                    const valueWidth =
                        font.widthOfTextAtSize(
                            valueText,
                            8.5
                        );


                    page.drawText(
                        valueText,
                        {
                            x:
                                summaryX +
                                summaryWidth -
                                valueWidth -
                                8,

                            y:
                                rowBottom +
                                5,

                            size: 8.5,

                            font
                        }
                    );

                }
            );


            yPosition =
                summaryBottom -
                18;


            // ====================================================
            // AMOUNT IN WORDS
            // ====================================================

            if (
                yPosition <
                BOTTOM_CONTENT + 100
            ) {

                addNewPage();

            }


            const words =
                this.numberToWords(
                    Math.floor(
                        totalAmount
                    )
                );


            page.drawText(
                `In Word: ${words}.`,
                {
                    x: marginLeft,

                    y: yPosition,

                    size: 9,

                    font: helvetica,

                    color:
                        rgb(
                            0.20,
                            0.20,
                            0.20
                        )
                }
            );


            yPosition -= 20;


            // ====================================================
            // NOTE
            // ====================================================

            page.drawText(
                "Note: (Excluding VAT & AIT)",
                {
                    x: marginLeft,

                    y: yPosition,

                    size: 8.5,

                    font: helvetica,

                    color:
                        rgb(
                            0.20,
                            0.20,
                            0.20
                        )
                }
            );


            // ====================================================
            // PAID STAMP
            // ====================================================
            //
            // PAID stamp appears in the CENTER of the page only
            // when the invoice is completely paid / settled.
            //
            // Partially paid invoices will NOT show the stamp.
            // ====================================================

            if (
                isFullyPaid &&
                paidStampImage
            ) {
            
                const paidWidth = 100;
                const paidHeight = 90;
            
                /*
                 * Put PAID stamp in the middle of the A4 page.
                 */
            
                const paidX =
                    (A4_WIDTH - paidWidth) / 2;
            
                const paidY =
                    (A4_HEIGHT - paidHeight) / 3.5;
            
                page.drawImage(
                    paidStampImage,
                    {
                        x: paidX,
                        y: paidY,
                    
                        width: paidWidth,
                        height: paidHeight,
                    
                        opacity: 0.85
                    }
                );
            }


            // ====================================================
            // SIGNATURE SECTION
            // ====================================================
            //
            // Layout:
            //
            // Best Regards
            //     [Signature Image]
            //     ________________
            //     Robin
            //     Managing Director
            //     Blue Tech
            //
            //                         [Blue Tech Seal]
            //
            // ====================================================


            /*
             * Fixed position near the bottom of the page.
             */

            const signatureY = 170;


            // ====================================================
            // LEFT SIGNATURE BLOCK
            // ====================================================

            const signatureX = marginLeft;


            // ----------------------------------------------------
            // Best Regards
            // ----------------------------------------------------

            page.drawText(
                "Best Regards",
                {
                    x: signatureX,
                    y: signatureY,
                
                    size: 9,
                
                    font: helveticaBold,
                
                    color:
                        rgb(
                            0.10,
                            0.10,
                            0.10
                        )
                }
            );


            // ----------------------------------------------------
            // SIGNATURE IMAGE
            // ----------------------------------------------------
            //
            // Signature image comes directly UNDER
            // "Best Regards".
            // ----------------------------------------------------

            if (signatureImage) {
            
                page.drawImage(
                    signatureImage,
                    {
                        x: signatureX + 5,
                    
                        y: signatureY - 42,
                    
                        width: 100,
                    
                        height: 38
                    }
                );
            }


            // ----------------------------------------------------
            // SIGNATURE LINE
            // ----------------------------------------------------

            const signatureLineY =
                signatureY - 47;


            page.drawLine(
                {
                    start: {
                        x: signatureX,
                        y: signatureLineY
                    },
                
                    end: {
                        x: signatureX + 135,
                        y: signatureLineY
                    },
                
                    thickness: 0.8,
                
                    color:
                        rgb(
                            0.30,
                            0.30,
                            0.30
                        )
                }
            );


            // ----------------------------------------------------
            // NAME
            // ----------------------------------------------------

            page.drawText(
                "Robin",
                {
                    x: signatureX,
                
                    y: signatureLineY - 14,
                
                    size: 9,
                
                    font: helveticaBold,
                
                    color:
                        rgb(
                            0.10,
                            0.10,
                            0.10
                        )
                }
            );


            // ----------------------------------------------------
            // DESIGNATION
            // ----------------------------------------------------

            page.drawText(
                "Managing Director",
                {
                    x: signatureX,
                
                    y: signatureLineY - 28,
                
                    size: 8.5,
                
                    font: helvetica,
                
                    color:
                        rgb(
                            0.15,
                            0.15,
                            0.15
                        )
                }
            );


            // ----------------------------------------------------
            // COMPANY
            // ----------------------------------------------------

            page.drawText(
                "Blue Tech",
                {
                    x: signatureX,
                
                    y: signatureLineY - 42,
                
                    size: 8.5,
                
                    font: helveticaBold,
                
                    color:
                        rgb(
                            0.15,
                            0.15,
                            0.15
                        )
                }
            );


            // ====================================================
            // BLUE TECH SEAL
            // ====================================================
            //
            // The seal is positioned a little to the RIGHT of
            // the signature block.
            // ====================================================

            if (blueTechSealImage) {
            
                const sealWidth = 85;
                const sealHeight = 85;
            
                const sealX =
                    signatureX + 155;
            
                const sealY =
                    signatureY - 55;
            
            
                page.drawImage(
                    blueTechSealImage,
                    {
                        x: sealX,
                        y: sealY,
                    
                        width: sealWidth,
                        height: sealHeight,
                    
                        opacity: 0.90
                    }
                );
            }


            // ====================================================
            // SAVE PDF
            // ====================================================

            const pdfBytes =
                await pdfDoc.save();


            return {
                pdfBuffer:
                    Buffer.from(
                        pdfBytes
                    ),

                emailSent:
                    false
            };

        } catch (error: any) {

            console.error(
                "Error generating Blue Tech invoice PDF:",
                error
            );


            throw new Error(
                `Failed to generate PDF: ${
                    error.message
                }`
            );
        }
    }


    // ============================================================
    // CURRENCY
    // ============================================================

    private formatCurrency(
        value: number
    ): string {

        return Number(
            value || 0
        ).toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
    }


    // ============================================================
    // NUMBER TO WORDS
    // ============================================================

    private numberToWords(
        amount: number
    ): string {

        const units = [
            "",
            "One",
            "Two",
            "Three",
            "Four",
            "Five",
            "Six",
            "Seven",
            "Eight",
            "Nine"
        ];


        const teens = [
            "Ten",
            "Eleven",
            "Twelve",
            "Thirteen",
            "Fourteen",
            "Fifteen",
            "Sixteen",
            "Seventeen",
            "Eighteen",
            "Nineteen"
        ];


        const tens = [
            "",
            "",
            "Twenty",
            "Thirty",
            "Forty",
            "Fifty",
            "Sixty",
            "Seventy",
            "Eighty",
            "Ninety"
        ];


        const convertBelow100 = (
            num: number
        ): string => {

            let text = "";


            if (num >= 20) {

                text +=
                    tens[
                        Math.floor(
                            num / 10
                        )
                    ] +
                    " ";


                num %= 10;

            } else if (num >= 10) {

                text +=
                    teens[
                        num - 10
                    ] +
                    " ";

                return text.trim();

            }


            if (num > 0) {

                text +=
                    units[num] +
                    " ";

            }


            return text.trim();
        };


        const convertBelow1000 = (
            num: number
        ): string => {

            let text = "";


            if (num >= 100) {

                text +=
                    units[
                        Math.floor(
                            num / 100
                        )
                    ] +
                    " Hundred ";


                num %= 100;

            }


            if (num > 0) {

                text +=
                    convertBelow100(
                        num
                    ) +
                    " ";

            }


            return text.trim();
        };


        if (
            amount === 0
        ) {

            return "Zero Taka Only";

        }


        let result = "";


        // Crore

        const crore =
            Math.floor(
                amount /
                10000000
            );


        amount %=
            10000000;


        // Lakh

        const lakh =
            Math.floor(
                amount /
                100000
            );


        amount %=
            100000;


        // Thousand

        const thousand =
            Math.floor(
                amount /
                1000
            );


        amount %=
            1000;


        // Hundred

        const hundredPart =
            amount;


        if (
            crore > 0
        ) {

            result +=
                convertBelow1000(
                    crore
                ) +
                " Crore ";

        }


        if (
            lakh > 0
        ) {

            result +=
                convertBelow1000(
                    lakh
                ) +
                " Lakh ";

        }


        if (
            thousand > 0
        ) {

            result +=
                convertBelow1000(
                    thousand
                ) +
                " Thousand ";

        }


        if (
            hundredPart > 0
        ) {

            result +=
                convertBelow1000(
                    hundredPart
                ) +
                " ";

        }


        return (
            result.trim() +
            " Taka Only"
        );
    }
}