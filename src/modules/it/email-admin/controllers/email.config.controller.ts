import { Controller } from "../../../../core/Controller";
import { HttpRequest, HttpResponse, NextFunc } from "../../../../core/Types";
import { EmailConfigService } from "../services/email.config.service";
import moment from "moment-timezone";
import { superAdminOnly } from "../../../../middlewares/super-admin-only";

export class EmailConfigController extends Controller {
    private emailConfigService: EmailConfigService;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.emailConfigService = new EmailConfigService();
    }

    public onRegister(): void {
        this.onGet("/it/email-config", [superAdminOnly], this.auth.private, this.index);
        this.onGet("/api/it/email-config/all", [], this.auth.private, this.getAllConfigs);
        this.onPost("/api/it/email-config/add", [], this.auth.private, this.addConfig);
        this.onGet("/api/it/email-config/edit/:id", [], this.auth.private, this.edit);
        this.onPut("/api/it/email-config/update/:id", [], this.auth.private, this.update);
    }

    public async index(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        return resp.view("it/email-config/index");
    }

    /**
     * ✅ Get all email configs (paginated + search)
     */
    public async getAllConfigs(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        const search = (req.query.search as string) || "";
        const page = parseInt(req.query.page as string, 10) || 1;
        const limit = parseInt(req.query.limit as string, 10) || 20;

        try {
            const { data, total, totalPages, currentPage } =
                await this.emailConfigService.getAll(page, limit, search);

            return resp.json({
                status: true,
                message: "Email configs fetched successfully",
                data,
                totalRecords: total,
                totalPages,
                currentPage,
                limit,
            });
        } catch (error: any) {
            console.error("Error fetching email configs:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to fetch email configs",
                error: error.message,
            });
        }
    }

    /**
     * ✅ Add a new email config
     */
    public async addConfig(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const body = req.body;
            body.createdBy = req.user?.userId || "system";

            // 🔥 Fix checkbox issue
            body.isActive = req.body.isActive === "on" || req.body.isActive === true || req.body.isActive === "1";

            // 🔥 Fix timezone issue
            body.createdAt = moment().tz("Asia/Dhaka").format("YYYY-MM-DD HH:mm:ss");

            const saved = await this.emailConfigService.create(body);

            return resp.json({
                status: true,
                message: "Email config saved successfully",
                data: saved,
            });
        } catch (error: any) {
            console.error("Error saving email config:", error);
            return resp.status(500).json({
                status: false,
                message: "Failed to save email config",
                error: error.message,
            });
        }
    }

    /**
     * ✅ Fetch single email config for editing
     */
    public async edit(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const id = Number(req.params.id);
            const result = await this.emailConfigService.edit(id);

            return resp.json({
                status: true,
                message: "Email config record fetched successfully",
                data: result,
            });
        } catch (err: any) {
            console.error("Error fetching email config:", err);
            return resp.json({ status: false, message: err.message });
        }
    }

    /**
     * ✅ Update an existing email config
     */
    public async update(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        try {
            const id = Number(req.params.id);

            const { type, email, appPassword, isActive } = req.body;

            const sanitizedData = {
                type: type?.trim() || null,
                email: email?.trim() || null,
                appPassword: appPassword?.trim() || null,
                isActive: String(isActive) === "true",
                updatedBy: req.user?.userId || "system",
            };

            console.log("Sanitized data being sent to service:", sanitizedData);

            const result = await this.emailConfigService.update(id, sanitizedData);

            return resp.json({
                status: true,
                message: "Email config updated successfully",
                data: result,
            });
        } catch (err: any) {
            console.error("Error updating email config:", err);
            return resp.json({
                status: false,
                message: err.message,
                data: "",
            });
        }
    }
}
