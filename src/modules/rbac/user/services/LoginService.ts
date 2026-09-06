import { IUserRepository } from "../interfaces/user-repository.interface";
import jwt from 'jsonwebtoken';
import { Config } from "../../../../core/Config";
import fs from "fs";
import { OtpEmailService } from './otp-email.service';
const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));
import axios from 'axios';
import crypto from 'crypto';

export class LoginService {
    private userRepository: IUserRepository;
    private otpEmailService = new OtpEmailService();

    constructor(userRepository: IUserRepository) {
        this.userRepository = userRepository;
    }

    public async authenticate(empId: string, password: string, session: any): Promise<string> {
        try {
            const applicationId = APP_CONFIG.login.applicationId;
            const token = APP_CONFIG.login.token;
            const username = empId;

            // Generate the key and get the formatted time
            const { key, time } = this.generateKey(applicationId, token, empId, password);

            // Make the API request with the generated key and formatted time
            const apiResponse = await axios.get(APP_CONFIG.login.apiBaseUrl, {
                params: {
                    application_id: applicationId,
                    time,
                    key,
                    username,
                    password
                }
            });

            if (!apiResponse.data.success) {
                throw new Error(apiResponse.data.message);
            }

            // If data is found, store it in session
            if (apiResponse.data) {
                session.empId = apiResponse.data.data.ept_employee_id;
                session.employee_name = apiResponse.data.data.employee_name;
            }

            return apiResponse.data.data.employee_name;

        } catch(error) {
            if (error.response) {
                throw new Error(error.response.data.message || 'Authentication failed due to an external service error.');
            } else if (error.request) {
                console.error("No Response Received:", error.request);
                throw new Error('No response received from the authentication service.');
            } else {
                console.error("Request Setup Error:", error.message);
                throw new Error('Error setting up authentication request.');
            }
        }
    }

    private generateKey(applicationId: number, token: string, username: string, password: string): string | any {
        const time = new Date().toISOString().replace('T', ' ').split('.')[0]; // Format time as 'YYYY-MM-DD HH:mm:ss'
        const rawString = `${token}${applicationId}${time}${username.toLowerCase()}${password}`;
        const key = crypto.createHash('md5').update(rawString).digest('hex');
        return { key, time };
    }

    public async generateToken(id: number, username: string, roleId: string, userId: string, roleName: string, empId: string, files:string): Promise<string> {
        return jwt.sign({ id, username, roleId, userId, roleName, empId, files }, APP_CONFIG.authSecret as string, { expiresIn: '1d' });
    }

    private otpStore: Map<string, string> = new Map(); // use Redis or DB in prod

    async storeOTP(id: number, otp: string) {
    const key = id.toString();
    this.otpStore.set(key, otp);
    setTimeout(() => this.otpStore.delete(key), 5 * 60 * 1000); // use the same key
    }

    async verifyOTP(id: number, otp: string) {
        return this.otpStore.get(id.toString()) === otp;
    }

    async sendOtpToEmail(email: string, otp: string, username: string) {
        await this.otpEmailService.sendOtp(email, otp, username);
    }

}
