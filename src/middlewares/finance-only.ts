import { HttpRequest, HttpResponse, NextFunc } from "../core/Types";

export function financeOnly(req: HttpRequest, res: HttpResponse, next: NextFunc) {
    const user = req.user;

    if (!user) {
        // Not logged in
        return res.status(401).json({ status: false, message: "Unauthorized: Login required" });
    }

    if (user.roleName !== "SuperAdmin" && user.roleName !== "Finance") {
        // Logged in but not Finance
        return res.status(403).render("401page", {
            title: "Forbidden",
            message: "Only Finance can access this page."
        });
    }

    // User is Finance — continue
    next();
}
