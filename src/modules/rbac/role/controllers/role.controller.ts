import { Controller } from "../../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../../core/Types";
import { validationMiddleware } from "../../../../validators/form.validation";
import { v4 as uuidv4 } from "uuid";
import { RoleService } from "../services/role.service";
import { RoleDto } from "../dtos/role.dto";
import slugify from "slugify";

export class RoleController extends Controller {

    private roleService: RoleService;
    private auth = { private: true, public: false };

    constructor() {
        super();
        this.roleService = this.getService("RoleService");
    }

    public onRegister(): void {
        this.onGet("/roles", [], this.auth.private, this.index);
        this.onPost("/roles/create", [validationMiddleware(RoleDto, 'api')], this.auth.private, this.create);
        this.onGet("/api/roles/all", [], this.auth.private, this.getRolesData);
        this.onGet("/api/roles/edit/:roleId", [], this.auth.private, this.edit);
        this.onPut("/api/roles/update/:roleId", [], this.auth.private, this.update);
    }

    public async index(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        return resp.view('rbac/role/index');
    }

    public async create(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        const { name, description, status }: { name: string; description?: string; status?: any } = req.body;

        if (!name || typeof name !== 'string') {
            return resp.status(400).json({
                status: false,
                message: "Invalid role name.",
                data: null,
            });
        }

        try {
            const isRoleExists = await this.roleService.getByName(name);
            if (isRoleExists) {
                return resp.status(409).json({
                    status: false,
                    message: "Role already exists!",
                    data: null,
                });
            }

            const roleId = uuidv4();
            const slug = slugify(name, { lower: true, strict: true });

            const newRole = await this.roleService.createRole({
                roleId,
                name,
                slug,
                description,
                status: status !== undefined ? status : true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            return resp.status(201).json({
                status: true,
                message: "Role created successfully!",
                data: newRole,
            });

        } catch (error: any) {
            return resp.status(500).json({
                status: false,
                message: "An error occurred while creating the role.",
                data: error.message,
            });
        }
    }

    public async getAllRoles(req: HttpRequest, res: HttpResponse): Promise<void> {
        try {
            const roles = await this.roleService.getAllRoles();
            res.status(200).json({
                status: true,
                message: "Roles fetched successfully",
                data: roles,
            });
        } catch (error) {
            console.error("Controller Error in getAllRoles:", error);
            res.status(500).json({
                status: false,
                message: "Failed to fetch roles",
                data: error.message,
            });
        }
    }

    public async getRolesData(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
        const { search, page = 1, limit = 10 } = req.query;

        const searchStr = typeof search === "string" ? search.trim() : undefined;
        const pageNum = Math.max(Number(page), 1);
        const limitNum = Math.min(Math.max(Number(limit), 1), 100);
        const { data, total, totalPages, currentPage } = await this.roleService.getAllRolesData(searchStr, pageNum, limitNum);

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
        const roleId = req.params.roleId;

        if (!roleId || typeof roleId !== 'string') {
          return resp.json({ status: false, message: "Invalid roleId provided" });
        }

        const result = await this.roleService.edit(roleId);
        return resp.json({
          status: true,
          message: "User record fetched!",
          data: {
            roleId: result.roleId,
            name: result.name,
            description: result.description,
            status: result.status
          }
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        return resp.json({ status: false, message: err.message });
      }
    }


    public async update(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
      try {
        const roleId = req.params.roleId;

        if (!roleId || typeof roleId !== 'string') {
          return resp.json({ status: false, message: "Invalid roleId provided" });
        }

        const {
          name,
          description,
          status
        } = req.body;

        const sanitizedData = {
          name,
          description,
          status: String(status) === 'true'
        };

        const result = await this.roleService.update(roleId, sanitizedData);

        return resp.json({
          status: true,
          message: "Role updated successfully!",
          data: result
        });
      } catch (err) {
        console.error("Error updating Role:", err);
        return resp.json({
          status: false,
          message: err.message,
          data: ''
        });
      }
    }
}
