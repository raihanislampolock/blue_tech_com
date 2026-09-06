import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    const message = err.message || "Internal server error";

    res.locals.errorMessage = message;
    return res.render('404page');
}

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
    const response: { status: number; error: boolean; message: string; data: any | null } = {
        status: 404,
        error: true,
        message: "Endpoint not found",
        data: null,
    };
    res.locals.errorMessage = response.message;
    return res.render('404page');
}
