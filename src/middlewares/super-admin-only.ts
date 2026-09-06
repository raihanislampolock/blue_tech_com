import { HttpRequest, HttpResponse, NextFunc } from "../core/Types";

export function superAdminOnly(req: HttpRequest, res: HttpResponse, next: NextFunc) {
    const user = req.user;

    if (!user) {
        // Not logged in
        return res.status(401).json({ status: false, message: "Unauthorized: Login required" });
    }

    if (user.roleName !== "SuperAdmin") {
        // Logged in but not SuperAdmin
        return res.status(403).render("401page", {
            title: "Forbidden",
            message: "Only SuperAdmins can access this page."
        });
    }

    // User is SuperAdmin — continue
    next();
}
