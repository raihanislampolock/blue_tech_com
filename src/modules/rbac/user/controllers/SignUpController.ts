import { Controller } from "../../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../../core/Types";
import { validationMiddleware } from "../../../../validators/form.validation";
import { SignUpService } from "../services/SignUpService";
import crypto from "crypto";
import { Config } from "../../../../core/Config";
import fs from "fs";
import { plainToClass } from 'class-transformer';
import { UserModel } from "../models/user.model";
import { RoleService } from "../../role/services/role.service";
import { v4 as uuidv4 } from "uuid";
import { SignupDto } from "../dtos/signup.dto";
import { UpdateDto } from "../dtos/update.dto";
import { request } from "http";
import dayjs from "dayjs";
import { upload } from "../../../../middlewares/upload";
import path from "path";

const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class SignUpController extends Controller {

  private signupService: SignUpService;
  private roleService: RoleService;
  private auth = { private: true, public: false };

  constructor() {
    super();
    this.signupService = this.getService("SignUpService");
    this.roleService = this.getService("RoleService");
  }

  public onRegister(): void {
    this.onGet("/signup", [], this.auth.private, this.signupView);
    this.onPost("/signup", [upload.single("file"), validationMiddleware(SignupDto, 'api')], this.auth.private, this.signup);
    this.onGet("/api/users/all", [], this.auth.private, this.getUsersWithRoles);
    this.onGet("/api/users/edit/:userId", [], this.auth.private, this.edit);
    this.onPut("/api/users/update/:userId", [upload.single("file"), validationMiddleware(UpdateDto, 'api')], this.auth.private, this.update);
    this.onPost("/api/users/check-empId", [], this.auth.private, this.checkempId);
    this.onPost("/api/users/reset-password", [], this.auth.private, this.resetPassword);
  }

  public async signupView(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    const roles = await this.roleService.getAllRoles();
    resp.bag.roles = roles;
    resp.view('rbac/user/index');
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
        const isEmpIdExists = await this.signupService.getByEmpId(empId);
        if (isEmpIdExists) {
            return resp.json({
                status: false,
                field: 'empId',
                message: "Employee ID already exists!",
                data: null,
            });
        }
        // Convert dateOfBirth from MM-DD-YYYY to YYYY-MM-DD
        const formattedDob = dateOfBirth
          ? dayjs(dateOfBirth, ['MM-DD-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD')
          : null;

        // 🔥 GET FILE FROM MULTER
        const file = (req as any).file
        // 🔥 SAVE FILE PATH (IMPORTANT)
        let filePath: string | null = null
        if (file) {
            filePath = `uploads/${file.filename}`; // store relative path
        }

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
            files: filePath,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: createdAt || new Date(),
            updatedAt: updatedAt || new Date(),
            createdBy: req.user?.userId || null
        };

        const result = await this.signupService.createUser(userData);
        return resp.json({ status: true, message: "User record created successfully!", data: result });

    } catch (err) {
      console.error("Error:", err);

      return resp.json({
        status: false,
        message: err instanceof Error ? err.message : "Something went wrong",
        data: ''
      });
    }
  }

  private digestPassword(pass: string): string {
    return crypto.createHmac('sha256', APP_CONFIG.authSecret)
      .update(`${pass} - ${APP_CONFIG.authSalt}`)
      .digest('hex');
  }

  public async getUsersWithRoles(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    const { search, page = 1, limit = 10 } = req.query;

    const searchStr = typeof search === "string" ? search.trim() : "";
    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Math.max(Number(limit), 1), 100);
    const { data, total, totalPages, currentPage } = await this.signupService.getAllUsersWithRoles(searchStr, pageNum, limitNum);

    return resp.json({
      currentPage,
      page: totalPages,
      limitNum,
      totalRecords: total,
      data,
    });
  }

  public async edit(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    try {
      const userId = req.params.userId;

      if (!userId || typeof userId !== 'string') {
        return resp.json({ status: false, message: "Invalid userId provided" });
      }

      const result = await this.signupService.edit(userId);

      const [firstName, ...rest] = result.username.trim().split(' ');
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
          files: result.files,
          roleId: result.roleId,
          isActive: result.isActive
        }
      });
    } catch (err) {
      console.error("Error:", err);

      return resp.json({
        status: false,
        message: err instanceof Error ? err.message : "Something went wrong",
        data: ''
      });
    }
  }



  public async update(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    try {
      const userId = req.params.userId;

      if (!userId || typeof userId !== 'string') {
        return resp.json({ status: false, message: "Invalid userId provided" });
      }

      // 🔥 Get existing item first
      const existing = await this.signupService.edit(userId);
      if (!existing) {
        return resp.status(404).json({
          status: false,
          message: "Item not found",
        });
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

      // Log rawDob for debugging
      console.log("Raw dateOfBirth from req.body:", rawDob);

      if (rawDob && !dayjs(rawDob, ['MM-DD-YYYY', 'YYYY-MM-DD'], true).isValid()) {
        return resp.json({ status: false, message: "Invalid dateOfBirth format" });
      }

      const formattedDob = rawDob && rawDob !== ''
        ? dayjs(rawDob, ['MM-DD-YYYY', 'YYYY-MM-DD']).format('YYYY-MM-DD')
        : null;

      console.log("Formatted dateOfBirth for DB:", formattedDob);

      const username = `${firstName?.trim() || ''} ${lastName?.trim() || ''}`.trim();

      // 🔥 Get uploaded file
      const file = (req as any).file;
      let filePath = existing.files;
      // ✅ If new file uploaded → delete old file
      if (file) {
        // delete old file if exists
        if (existing.files) {
          const oldPath = path.join(process.cwd(), existing.files);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath); // 🗑 delete old file
          }
        }
        // save new file path
        filePath = `uploads/${file.filename}`;
      }

      const sanitizedData = {
        empId: empId?.trim() || null,
        username,
        gender: gender?.trim() || null,
        dateOfBirth: formattedDob,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        roleId,
        files: filePath,
        isActive: String(isActive) === 'true'
      };

      console.log("Sanitized data being sent to service:", sanitizedData);

      const result = await this.signupService.update(userId, sanitizedData);

      console.log("Update service result:", result);

      return resp.json({
        status: true,
        message: "User updated successfully!",
        data: result
      });

    } catch (err) {
      console.error("Error:", err);

      return resp.json({
        status: false,
        message: err instanceof Error ? err.message : "Something went wrong",
        data: ''
      });
    }
  }


  public async checkempId(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    const { empId } = req.body;

    const result = await this.signupService.getByEmpId(empId);

    if (!result) {
        return resp.json({
            status: false,
            message: "No data found!",
            data: null,
        });
    }

    return resp.json({
        status: true,
        message: "User data found!",
        data: result,
    });
  }

  public async resetPassword(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    try {
      const { userId, oldPassword, newPassword } = req.body;

      if (!userId || !oldPassword || !newPassword) {
        return resp.json({ status: false, message: "All fields are required." });
      }

      const user = await this.signupService.getById(userId);
      if (!user) {
        return resp.json({ status: false, message: "User not found." });
      }

      const hashedOldPassword = this.digestPassword(oldPassword);
      if (user.password !== hashedOldPassword) {
        return resp.json({ status: false, message: "Old password is incorrect." });
      }

      const hashedNewPassword = this.digestPassword(newPassword);
      await this.signupService.updatePassword(userId, hashedNewPassword);

      return resp.json({ status: true, message: "Password updated successfully!" });

    } catch (err) {
      console.error("Error:", err);

      return resp.json({
        status: false,
        message: err instanceof Error ? err.message : "Something went wrong",
        data: ''
      });
    }
  }
}
