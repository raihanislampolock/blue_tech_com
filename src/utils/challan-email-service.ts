import nodemailer from 'nodemailer';
import { Config } from "../core/Config";
import fs from "fs";

// Load config
const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class ChallanEmailService {
    private transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: APP_CONFIG.smtp.host,
            port: APP_CONFIG.smtp.port,
            secure: APP_CONFIG.smtp.secure,
            auth: {
                user: APP_CONFIG.smtp.auth.user,
                pass: APP_CONFIG.smtp.auth.pass
            }
        });
    }

    async sendChallanPdf(email: string, companyName: string, pdfBuffer: Buffer, challanNumber: string): Promise<void> {
        const mailOptions = {
            from: APP_CONFIG.smtp.from,
            to: email,
            subject: `Challan from RMS Tech Solutions - ${challanNumber}`,
            text: `Dear ${companyName},\n\nWe have successfully processed your shipment.

Please find attached Delivery Challan Number ${challanNumber} for your reference.

If you have any questions regarding this delivery, feel free to reply directly to this email.

Thank you for partnering with us.

Best regards,
The RMS Tech Solutions Team`,
            attachments: [
                {
                    filename: `challan-${challanNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        await this.transporter.sendMail(mailOptions);
    }
}