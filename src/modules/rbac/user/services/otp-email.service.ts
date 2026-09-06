import nodemailer from 'nodemailer';
import { Config } from "../../../../core/Config";
import fs from "fs";

// Load config
const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class OtpEmailService {
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

  async sendOtp(email: string, otp: string, username: string): Promise<void> {
    const mailOptions = {
      from: APP_CONFIG.smtp.from,
      to: email,
      subject: 'One Time Password for your Internal Portal',
      text: `Dear ${username},\n
      Your One-Time Password (OTP) is PNO - ${otp}.
      This OTP is to be used for the Internal Portal Password Reset. It is valid for 2 minutes.
      Do not share your One-Time Password (OTP) with anyone.

      For more information, please refer to the Contact Us email, phit@praavahealth.com", or call our 24-hour
      Call Centre by dialing 10648.

Thank You!
    `
    };

    await this.transporter.sendMail(mailOptions);
  }
}
