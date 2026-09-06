import { Controller } from "../../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../../core/Types";
import { LoginService } from "../services/LoginService";
import { validationMiddleware } from "../../../../validators/form.validation";
import { RoleRepository } from "../../role/repositories/role.repository";
import { SignUpService } from "../services/SignUpService";
import { Config } from "../../../../core/Config";
import fs from "fs";
import crypto from "crypto";
const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class LoginController extends Controller {

    private loginService: LoginService;
    private signupService: SignUpService;
    private roleRepository: RoleRepository;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.loginService = this.getService("LoginService");
        this.signupService = this.getService("SignUpService");
        this.roleRepository = new RoleRepository();
    }

    public onRegister(): void {
        this.onGet("/", [], this.auth.public, this.loginView);

        // Handle login form submission and redirect to OTP verification
        this.onPost("/login", [], this.auth.public, this.loginCheck);

        this.onGet("/logout", [], this.auth.public, this.logout);

        this.onPost("/forgot-password", [], this.auth.public, this.sendOTP);

        // Forgot Password - Step 2: Verify OTP
        this.onPost("/verify-otp", [], this.auth.public, this.verifyOTP);

        // Forgot Password - Step 3: Reset Password
        this.onPost("/reset-password", [], this.auth.public, this.resetPassword);
    }

    public loginView(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        resp.view('login');
    }

    public async loginCheck(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        const empId = req.body.empId;
        const password = req.body.password;
        const ref = typeof req.query.ref !== "undefined" ? req.query.ref as string : '/dashboard';
        try {
            // Authenticate user with empId and password
            const user = await this.signupService.getByEmpId(empId);
            if (!user || !user.isActive || user.password !== this.digestPassword(password)) {
                resp.bag.errorMessage = 'Invalid empId or password!';
                return resp.view('login');
            }
            const role = await this.roleRepository.getById(user.roleId);  // You must implement this in your repository
            const roleName = role?.name || 'Unknown';

            const jwtToken = await this.loginService.generateToken(user.id, user.username, user.roleId, user.userId, roleName,  user.empId, user.files);

            resp.cookie('auth_token', jwtToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' && req.protocol === 'https',  // Only secure in production with HTTPS
                maxAge: 3 * 60 * 60 * 1000, // 3 hours in milliseconds
                sameSite: 'strict'
            });

            return resp.redirect(ref);
        } catch (error) {
            resp.bag.errorMessage = error.message;
            resp.view('login');
        }
    }

    private digestPassword(pass: string): string {
        return crypto.createHmac('sha256', APP_CONFIG.authSecret)
            .update(`${pass} - ${APP_CONFIG.authSalt}`)
            .digest('hex');
    }

    public logout(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        // Clear the auth token by setting an expired cookie
        resp.cookie('auth_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            expires: new Date(0),  // Set the expiration date to the past to delete the cookie
            sameSite: 'strict'
        });

        // Destroy the session
        req.session.destroy((err: Error | null) => {
            if (err) {
                return next(err);  // Handle error
            }
            // Redirect to the login page after logout
            return resp.redirect('/');
        });
    }

    // Step 1 - Send OTP to user email
    public async sendOTP(req: HttpRequest, resp: HttpResponse) {
        const empId = req.body.empId;
        try {
            const user = await this.signupService.getByEmpId(empId);
            if (!user || !user.isActive) {
                return resp.json({ success: false, message: 'Invalid or inactive employee ID' });
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            await this.loginService.storeOTP(user.id, otp); // implement this
            await this.loginService.sendOtpToEmail(user.email, otp, user.username); // implement this

            return resp.json({ success: true, message: 'OTP sent to registered email' });
        } catch (err) {
            return resp.json({ success: false, message: err.message });
        }
    }

    // Step 2 - Verify OTP
    public async verifyOTP(req: HttpRequest, resp: HttpResponse) {
        const { empId, otp } = req.body;
        try {
            const user = await this.signupService.getByEmpId(empId);
            const isValid = await this.loginService.verifyOTP(user.id, otp); // implement this
            if (!isValid) {
                return resp.json({ success: false, message: 'Invalid OTP' });
            }
            return resp.json({ success: true, message: 'OTP verified' });
        } catch (err) {
            return resp.json({ success: false, message: err.message });
        }
    }

    // Step 3 - Reset Password
    public async resetPassword(req: HttpRequest, resp: HttpResponse) {
        const { empId, newPassword } = req.body;
        try {
            const user = await this.signupService.getByEmpId(empId);
            const newHashedPassword = this.digestPassword(newPassword);
            await this.signupService.updatePassword(user.userId, newHashedPassword); // implement this
            return resp.json({ success: true, message: 'Password updated successfully' });
        } catch (err) {
            return resp.json({ success: false, message: err.message });
        }
    }

}
