
import { Request, Response, NextFunction } from "express";
import { PathParams } from "express-serve-static-core";
import { IUserToken } from "./IUserProvider";
import { SessionData } from 'express-session';
import { Express } from "express";

export interface CustomSessionData extends SessionData {
    empId?: number;
    employee_name?: string;
    user?: IUserToken;
}

export interface HttpRequest extends Request {
    user: IUserToken;
    session: any;

    // ✅ Add files property for multer
    files?: Express.Multer.File[];
}


export interface HttpResponse extends Response {

    /**
     * Feel free to use `bag` to set data from controller or any other middlewares
     * 1. You can use `bag` in any middleware to pass values to view engine
     * 2. Even if you don't use `bag` in controller feel free to use `view` so that middleware assigned data is rendered
     *
     * One typical example is a menu middleware that can be used to inject dynamic menu to the view engine.
     * Otherwise every controller would have to pass the same data in the `render` function.
     */
    bag: any;

    /**
     * Bag and view are alternative ways to render templates.
     * Enables support for passing data to view engine from intermediate middlewares.
     * It can be used like `render` function as usual
     * however if any value present in `bag` is merged with options.
     */
    view: (view: string, options?: object, callback?: (err: Error, html: string) => void) => void;
}

export type NextFunc = NextFunction;
export type PathParam = PathParams;

// export interface HttpRequest extends Request {
//     user: IUserToken;
//     session: Session & Partial<CustomSessionData>;
// }