import nodemailer from 'nodemailer';
import { Config } from "../core/Config";
import fs from "fs";

// Load config
const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class PurchaseEmailService {
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

  async sendPurchasePdf(email: string, supplierName: string, supplierEmail: Buffer, purchaseNumber: string): Promise<void> {
    const mailOptions = {
      from: APP_CONFIG.smtp.from,
      to: email,
      subject: `Purchase Order from RMS Tech Solutions - ${purchaseNumber}`,
      text: `Dear ${supplierName},\n\nPlease find attached the purchase order for your reference.\n\nBest regards,\nRMS Tech Solutions Team`,
      attachments: [
        {
          filename: `purchase-${purchaseNumber}.pdf`,
          content: supplierEmail,
          contentType: 'application/pdf'
        }
      ]
    };

    await this.transporter.sendMail(mailOptions);
  }
}