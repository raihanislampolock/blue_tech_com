import { HttpRequest, HttpResponse, NextFunc } from "../core/Types";
import { AppDataSource } from "../../src/init";
import { UserModel } from "../modules/rbac/user/models/user.model";
import { RolePermissionModel } from "../modules/rbac/role.permission/models/role.permission";

export const checkPermission = (permissionSlugs: string[] | string) => {
    const slugs = Array.isArray(permissionSlugs) ? permissionSlugs : [permissionSlugs];

    return async (req: HttpRequest, res: HttpResponse, next: NextFunc) => {
        try {
            const user = req.user; // ✅ use this instead of req.userId

            if (!user) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            // Fetch role permissions
            const rolePermissions = await AppDataSource.getRepository(RolePermissionModel)
                .createQueryBuilder("rp")
                .leftJoinAndSelect("rp.permission", "permission")
                .where("rp.roleId = :roleId", { roleId: user.roleId })
                .getMany();

            const hasPermission = rolePermissions.some(rp =>
                slugs.includes(rp.permission.slug)
            );

            if (!hasPermission) {
                return res.status(403).json({ message: "Access denied" });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error", error });
        }
    };
};
