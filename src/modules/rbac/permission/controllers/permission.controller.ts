import { Controller } from "../../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../../core/Types";
import { validationMiddleware } from "../../../../validators/form.validation";
import { PermissionService } from "../services/permission.service";
import { Config } from "../../../../core/Config";
import fs from "fs";
import { RoleService } from "../../role/services/role.service";
import { v4 as uuidv4 } from "uuid";
import { PermissionDto } from "../dtos/permission.dto";
import slugify from 'slugify';

const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync("config.json").toString()));

export class PermissionController extends Controller {

  private PermissionService: PermissionService;
  private roleService: RoleService;
  private auth = { private: true, public: false };

  constructor() {
    super();
    this.PermissionService = this.getService("PermissionService");
    this.roleService = this.getService("RoleService");
  }

  public onRegister(): void {
    this.onGet("/permission", [], this.auth.private, this.permissionView);
    this.onPost("/permission", [validationMiddleware(PermissionDto, 'api')], this.auth.private, this.permission);
    this.onGet("/api/permissions/all", [], this.auth.private, this.getPermission);
    this.onGet("/api/permissions/edit/:permissionId", [], this.auth.private, this.edit);
    this.onPut("/api/permissions/update/:permissionId", [validationMiddleware(PermissionDto, 'api')], this.auth.private, this.update);
  }

  public async permissionView(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    const roles = await this.roleService.getAllRoles();
    resp.bag.roles = roles;
    resp.view('rbac/permission/index');
  }

  public async getPermission(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    const { search, page = 1, limit = 10 } = req.query;

    const searchStr = typeof search === "string" ? search.trim() : "";
    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Math.max(Number(limit), 1), 100);
    const { data, total, totalPages, currentPage } = await this.PermissionService.getAllPermission(searchStr, pageNum, limitNum);

    return resp.json({
      currentPage,
      page: totalPages,
      limitNum,
      totalRecords: total,
      data,
    });
  }

  public async permission(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    try {
        const {
            permissionId,
            name,
            slug,
            isActive,
            createdAt,
            updatedAt
        } = req.body;

        if (permissionId) {
            const isPermissionIdExists = await this.PermissionService.getByPermissionId(permissionId);
            if (isPermissionIdExists) {
                return resp.json({
                    status: false,
                    field: 'permissionId',
                    message: "Permission ID already exists!",
                    data: null,
                });
            }
        }

        const permissionData = {
            permissionId: permissionId || uuidv4(),
            name,
            slug: slug ? slugify(slug, { lower: true, strict: true }) : slugify(name, { lower: true, strict: true }),
            isActive: isActive !== undefined ? isActive : true,
            createdAt: createdAt || new Date(),
            updatedAt: updatedAt || new Date(),
            createdBy: req.user?.userId || null
        };

        const result = await this.PermissionService.createPermission(permissionData);
        return resp.json({ status: true, message: "Permission record created successfully!", data: result });

    } catch (err) {
      console.error("Error:", err);

      return resp.json({
        status: false,
        message: err instanceof Error ? err.message : "Something went wrong",
        data: ''
      });
    }
  }

  public async edit(req: HttpRequest, resp: HttpResponse, next: NextFunc) {
    try {
      const permissionId = req.params.permissionId;

      if (!permissionId || typeof permissionId !== 'string') {
        return resp.json({ status: false, message: "Invalid permissionId provided" });
      }

      const result = await this.PermissionService.edit(permissionId);

      return resp.json({
        status: true,
        message: "Permission record fetched!",
        data: {
          permissionId: result.permissionId,
          name: result.name,
          slug: result.slug,
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
      const permissionId = req.params.permissionId;

      if (!permissionId || typeof permissionId !== 'string') {
        return resp.json({ status: false, message: "Invalid permissionId provided" });
      }

      const {
        name,
        slug,
        isActive
      } = req.body;

      const sanitizedData = {
        name,
        slug: slug ? slugify(slug, { lower: true, strict: true }) : slugify(name, { lower: true, strict: true }),
        isActive: String(isActive) === 'true'
      };

      const result = await this.PermissionService.update(permissionId, sanitizedData);

      return resp.json({
        status: true,
        message: "Permission updated successfully!",
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
}