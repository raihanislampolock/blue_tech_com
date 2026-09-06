// src/modules/rbac/profile/controllers/profile.controller.ts
import { Controller } from "../../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../../core/Types";
import { validationMiddleware } from "../../../../validators/form.validation";
import { ProfileService } from "../services/profile.service";
import crypto from "crypto";
import { Config } from "../../../../core/Config";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { SignupDto } from "../../user/dtos/signup.dto";
import { UpdateDto } from "../../user/dtos/update.dto";
import dayjs from "dayjs";

const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class ProfileController extends Controller {

    private profileService: ProfileService;
    private careService: any;
    private roleService: any;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.profileService = this.getService("ProfileService");
        this.careService = this.getService("CareService");
        this.roleService = this.getService("RoleService");
    }

    public onRegister(): void {
        this.onGet("/profile", [], this.auth.private, this.profileView);
        this.onPost("/profile", [validationMiddleware(SignupDto, 'api')], this.auth.private, this.signup);
        this.onGet("/api/profile/all", [], this.auth.private, this.getProfileWithRoles);
        this.onGet("/api/profile/edit/:userId", [], this.auth.private, this.edit);
        this.onPut("/api/profile/update/:userId", [validationMiddleware(UpdateDto, 'api')], this.auth.private, this.update);
        this.onPost("/api/profile/check-empId", [], this.auth.private, this.checkempId);
        this.onPost("/api/profile/reset-password", [], this.auth.private, this.resetPassword);
    }

    public async profileView(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        const services = await this.careService.getAllServices();
        const roles = await this.roleService.getAllRoles();
        resp.bag.services = services;
        resp.bag.roles = roles;
        resp.view('rbac/profile/index');
    }

    public async signup(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const {
                userId,
                firstName,
                lastName,
                empId,
                password: userPassword,
                roleId,
                gender,
                dateOfBirth,
                email,
                phone,
                address,
                isActive,
                createdAt,
                updatedAt
            } = req.body;

            const username = `${firstName} ${lastName}`.trim();
            const isEmpIdExists = await this.profileService.getByEmpId(empId);
            if (isEmpIdExists) {
                return resp.json({
                    status: false,
                    field: 'empId',
                    message: "Employee ID already exists!",
                    data: null,
                });
            }

            const formattedDob = dateOfBirth
                ? dayjs(dateOfBirth, ['MM-DD-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD')
                : null;

            const userData = {
                userId: userId || uuidv4(),
                username,
                empId,
                password: this.digestPassword(userPassword),
                roleId,
                gender,
                dateOfBirth: formattedDob,
                email,
                phone,
                address,
                isActive: isActive !== undefined ? isActive : true,
                createdAt: createdAt || new Date(),
                updatedAt: updatedAt || new Date(),
                createdBy: req.user?.userId || null
            };

            const result = await this.profileService.createUser(userData);
            return resp.json({ status: true, message: "User record created successfully!", data: result });

        } catch (err) {
            console.error('Create User error:', err);
            return resp.json({ status: false, message: err.message || 'Failed to create user', data: '' });
        }
    }

    private digestPassword(pass: string): string {
        return crypto.createHmac('sha256', APP_CONFIG.authSecret)
            .update(`${pass} - ${APP_CONFIG.authSalt}`)
            .digest('hex');
    }

    public async getProfileWithRoles(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const empIdStr = req.user?.empId;
            if (!empIdStr) {
                return resp.status(401).json({ status: false, message: "Unauthorized" });
            }

            const { data } = await this.profileService.getAllUsersWithRoles(empIdStr, undefined, 1, 1);

            return resp.json({
                status: true,
                data: data[0] || null
            });
        } catch (err) {
            console.error("Error in getProfileWithRoles:", err);
            return resp.json({ status: false, message: err.message || 'Failed to fetch user', data: null });
        }
    }




    public async edit(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const userId = req.params.userId;

            if (!userId || typeof userId !== 'string') {
                return resp.json({ status: false, message: "Invalid userId provided" });
            }

            const result = await this.profileService.edit(userId);
            if (!result) return resp.json({ status: false, message: "User not found." });

            const [firstName, ...rest] = (result.username || '').trim().split(' ');
            const lastName = rest.join(' ') || '';

            return resp.json({
                status: true,
                message: "User record fetched!",
                data: {
                    userId: result.userId,
                    empId: result.empId,
                    firstName,
                    lastName,
                    gender: result.gender || '',
                    dateOfBirth: result.dateOfBirth,
                    email: result.email,
                    phone: result.phone,
                    address: result.address,
                    roleId: result.roleId,
                    isActive: result.isActive
                }
            });
        } catch (err) {
            console.error("Error fetching user data:", err);
            return resp.json({ status: false, message: err.message || 'Failed to fetch user' });
        }
    }

    public async update(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const userId = req.params.userId;

            if (!userId || typeof userId !== 'string') {
                return resp.json({ status: false, message: "Invalid userId provided" });
            }

            const {
                firstName,
                lastName,
                gender,
                dateOfBirth: rawDob,
                email,
                phone,
                address,
                empId,
                roleId,
                isActive
            } = req.body;

            if (rawDob && !dayjs(rawDob, ['MM-DD-YYYY', 'YYYY-MM-DD'], true).isValid()) {
                return resp.json({ status: false, message: "Invalid dateOfBirth format" });
            }

            const formattedDob = rawDob && rawDob !== ''
                ? dayjs(rawDob, ['MM-DD-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD')
                : null;

            const username = `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim();

            const sanitizedData = {
                empId: empId?.trim() || null,
                username,
                gender: gender?.trim() || null,
                dateOfBirth: formattedDob,
                email: email?.trim() || null,
                phone: phone?.trim() || null,
                address: address?.trim() || null,
                roleId,
                isActive: String(isActive) === 'true'
            };

            const result = await this.profileService.update(userId, sanitizedData);

            return resp.json({
                status: true,
                message: "User updated successfully!",
                data: result
            });

        } catch (err) {
            console.error("Error updating user:", err);
            return resp.json({
                status: false,
                message: err.message || "Failed to update user",
                data: ''
            });
        }
    }

    public async checkempId(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const { empId } = req.body;

            const result = await this.profileService.getByEmpId(empId);

            if (!result) {
                return resp.json({
                    status: false,
                    message: "No data found!",
                    data: null,
                });
            }
            return resp.json({
                status: true,
                message: "Patient data found!",
                data: result,
            });
        } catch (err) {
            console.error("Error in checkempId:", err);
            return resp.json({ status: false, message: err.message || 'Failed to fetch emp data' });
        }
    }

    public async resetPassword(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const { userId, newPassword } = req.body;

            if (!userId || !newPassword) {
                return resp.json({ status: false, message: "All fields are required." });
            }

            const user = await this.profileService.getById(userId);
            if (!user) {
                return resp.json({ status: false, message: "User not found." });
            }

            const hashedNewPassword = this.digestPassword(newPassword);
            await this.profileService.updatePassword(userId, hashedNewPassword);

            return resp.json({ status: true, message: "Password updated successfully!" });

        } catch (err) {
            console.error("Reset password error:", err);
            return resp.json({
                status: false,
                message: err.message || "Failed to reset password"
            });
        }
    }
}
