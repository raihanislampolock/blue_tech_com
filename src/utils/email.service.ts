// import nodemailer from "nodemailer";
// import { AppDataSource } from "../init";
// import { EmailConfigModel } from "../modules/it/email-admin/models/email.config.model";

// type EmailType = 'prescription' | 'imaging' | 'b2b' | 'invoice' | 'b2c';

// interface EmailParams {
//   to: string;
//   patientName: string;
//   mrno?: string;
//   attachmentBuffer: Buffer;
//   filename: string;
//   contentType?: string;
//   type: EmailType;
// }

// export class EmailService {

//   private transporters: Record<EmailType, nodemailer.Transporter> = {} as any;

//   /** Initialize transporter dynamically from DB */
//   private async initTransporter(type: EmailType) {
//     if (this.transporters[type]) return this.transporters[type];

//     const config = await AppDataSource.getRepository(EmailConfigModel)
//       .findOne({ where: { type } });

//     if (!config) throw new Error(`Email config for ${type} not found`);

//     this.transporters[type] = nodemailer.createTransport({
//       service: "gmail",
//       auth: {
//         user: config.email,
//         pass: config.appPassword,
//       },
//     });

//     return this.transporters[type];
//   }

//   public async sendEmail(params: EmailParams): Promise<{ success: boolean; message: string }> {
//     const { to, patientName, mrno, attachmentBuffer, filename, contentType, type } = params;

//     try {
//       const transporter = await this.initTransporter(type);
//       const emailContent = this.generateEmailContent(type, patientName, mrno);

//       await transporter.sendMail({
//         from: emailContent.from,
//         to,
//         subject: emailContent.subject,
//         text: emailContent.text,
//         attachments: [
//           { filename, content: attachmentBuffer, contentType: contentType || "application/pdf" },
//         ],
//       });

//       return { success: true, message: `✅ ${type} email sent successfully.` };
//     } catch (error: any) {
//         console.error(`❌ Failed to send ${type} email:`, error);

//         if (error.code === "EAUTH" || error.responseCode === 535) {
//             throw new Error(`Authentication failed. App password may be expired.`);
//         }

//         throw new Error(`error.message`);
//     }
//   }

//   private generateEmailContent(type: EmailType, patientName: string, mrno: string) {
//     if (type === 'imaging') {
//       return {
//         from: 'medicalserviceinfo@praavahealth.com',
//         subject: 'Your Imaging Report',
//         text: `Dear ${patientName},\n\nThank you for choosing Praava and trusting us to be your partner in health.

// Please see your report attached to this email. You may also come to our facility to pick up a hard copy of the report. Kindly ensure to collect your hard copy report within 3 months. Imaging films or scans such as X-Ray, USG, ECG, ECHO, and ETT will not be available in our system after 3 months. Thank you for your understanding.

// For any queries regarding your report, please call us at 10648 or message us on Facebook. Your privacy is also of utmost importance to us. For more information, please view our privacy notice.

// At Praava, we are working relentlessly to deliver on our promise of keeping patients at the core of everything we do. If you have any feedback or concerns, please reach out to us at 10648 or email us at praavalistens@praavahealth.com. Our management team and CEO review your feedback personally so we can constantly improve our services.

// Stay healthy & stay safe - & remember, at Praava, you are more than a Patient, you are family.

// In good health,
// The Praava Health Team`,
//       };
//     }

//     if (type === 'b2b') {
//       return {
//         from: 'laboratory@praavahealth.com',
//         subject: `Praava Health Lab Report: ${patientName} ${mrno}`,
//         text: `Hello ${patientName},\n\nThank you for choosing Praava and trusting us to be your partner in health.

// Your laboratory report is ready. Please see your report attached with this email. You may also come to our facility to pick up a  hard copy of the report.

// Soon, you will also be able to view your report on our online and app-enabled Patient Portal (available for both iOS and Android). You will be able to access the following features any time:

// • Book appointments online with the option to pre-pay.

// • Access lab and imaging results online.

// Access prescriptions and invoices online
// View lab services and health packages online with the option to pre-pay
// View list of doctors specialty wise
// Register and link your family members under the same phone number

// • Upload your medical records, even from facilities other than Praava, so you can store and remotely access them in one  place.
// • Purchase Annual Membership Plans for unlimited access to our family health professionals and all your testing needs  at a discounted rate.
// • Receive regular updates about new services and special offers.

// For any discrepancies or queries regarding your report, please call our Contact Center: 10648.

// Your privacy is of utmost importance to us. For further information, please view our privacy notice.

// At Praava, it is our mission to put our patients first. We want to learn how we can serve you better. Please contact us with any  feedback or comments at praavalistens@praavahealth.com

// Warm regards,

// Praava Health

// Remember - prevention is always better than cure. Be healthy & stay healthy!

// Appointments + Patient Services: 10648 | appointments@praavahealth.com

// Web: www.praavahealth.com
// Facebook: https://facebook.com/praavahealth
// Twitter: https://twitter.com/praavahealth
// Linkedin: https://likedin.com/company/1012042`,
//     };
//   }

//     if (type === 'b2c') {
//       return {
//         from: 'laboratory@praavahealth.com',
//         subject: `Praava Health Lab Report: ${patientName}`,
//         text: `Hello ${patientName},\n\nThank you for choosing Praava and trusting us to be your partner in health.

// Your laboratory report is ready. Please see your report attached with this email. You may also come to our facility to pick up a  hard copy of the report.

// Soon, you will also be able to view your report on our online and app-enabled Patient Portal (available for both iOS and Android). You will be able to access the following features any time:

// • Book appointments online with the option to pre-pay.

// • Access lab and imaging results online.

// Access prescriptions and invoices online
// View lab services and health packages online with the option to pre-pay
// View list of doctors specialty wise
// Register and link your family members under the same phone number

// • Upload your medical records, even from facilities other than Praava, so you can store and remotely access them in one  place.
// • Purchase Annual Membership Plans for unlimited access to our family health professionals and all your testing needs  at a discounted rate.
// • Receive regular updates about new services and special offers.

// For any discrepancies or queries regarding your report, please call our Contact Center: 10648.

// Your privacy is of utmost importance to us. For further information, please view our privacy notice.

// At Praava, it is our mission to put our patients first. We want to learn how we can serve you better. Please contact us with any  feedback or comments at praavalistens@praavahealth.com

// Warm regards,

// Praava Health

// Remember - prevention is always better than cure. Be healthy & stay healthy!

// Appointments + Patient Services: 10648 | appointments@praavahealth.com

// Web: www.praavahealth.com
// Facebook: https://facebook.com/praavahealth
// Twitter: https://twitter.com/praavahealth
// Linkedin: https://likedin.com/company/1012042`,
//     };
//   }

//     if (type === 'invoice') {
//       return {
//         from: 'info@praavahealth.com',
//         subject: 'Praava Invoice',
//         text: `Dear ${patientName},\n\nThank you for trusting us to be your partner in health. We've attached your invoice below. Please call us at 10648 and let us know if there is anything else we can help you with.

// At Praava, we are working relentlessly to deliver on our promise of keeping patients at the core of everything we do. If you have any feedback or concerns, please reach out to us at 10648 or email us at praavalistens@praavahealth.com. Our management team and CEO review all of your feedback personally so that we can constantly improve our services.


// Stay healthy & stay safe - & remember, at Praava, you are more than a Patient, you are family.

// In good health,

// The Praava Health Team`,
//     };
//   }

//     return {
//       from: 'prescription@praavahealth.com',
//       subject: 'Your Prescription Report',
//       text: `Dear ${patientName},\n\nYour prescription is attached to this email. You can book your suggested tests or order your medication at Praava - our Contact Center will be in touch with you soon. You can also order your medication online or call or WhatsApp our pharmacy directly at +8801847278019.

// At Praava, we are working relentlessly to deliver on our promise of keeping patients at the core of everything we do. If you have any feedback or concerns, please reach out to us at 10648 or email us at praavalistens@praavahealth.com. Our management team and CEO review all of your feedback personally so that we can constantly improve our services.

// Stay healthy & stay safe - & remember, at Praava, you are more than a Patient, you are family.

// In good health,
// The Praava Health Team`,
//     };
//   }
// }
