import nodemailer from 'nodemailer';
import { Config } from "../core/Config";
import fs from "fs";

// Load config
const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class QuotationEmailService {
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

  async sendQuotationPdf(email: string, companyName: string, pdfBuffer: Buffer, refNumber: string): Promise<void> {
    const mailOptions = {
      from: APP_CONFIG.smtp.from,
      to: email,
      subject: `Quotation from RMS Tech Solutions - ${refNumber}`,
      text: `Dear ${companyName},\n\nPlease find attached the quotation for your reference.\n\nBest regards,\nRMS Tech Solutions Team`,
      attachments: [
        {
          filename: `quotation-${refNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await this.transporter.sendMail(mailOptions);
  }
}