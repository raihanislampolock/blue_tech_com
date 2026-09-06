
import jwt from "jsonwebtoken";
import { IUserToken, Role } from "./IUserProvider";
import { HttpRequest, HttpResponse, NextFunc } from "./Types";
import { Middleware } from "./Middleware";
import crypto from "crypto";
import { Application } from "./Application";


export class Authenticator extends Middleware {
    public User: IUserToken;
    public readonly AUTH_COOKIE_NAME = "__session_auth";
    public constructor(private app: Application) { super(); }
    /**
     * Authenticate the user and return the token
     * If authentication fails, it return null
     * @param username to authenticate for
     * @param password to authenticate with
     */
    // public async authenticate(username: string, password: string) {
    //     // Find the user to authenticate or return null on failure
    //     const user = await this.app.UserProvider.get(username);
    //     console.log(user.password)
    //     console.log(this.digestPassword(password))
    //     if (!user || !user.isActive || user.password !== this.digestPassword(password)) return (req: HttpRequest, res: HttpResponse) => false;

    //     const token = jwt.sign({
    //         id: user._id,
    //         name: user.fullName,
    //         username: user.username,
    //         role: user.role,
    //         signedAt: new Date(),
    //         check: user.password.substr(0, 6)
    //     }, this.app.config.sessionSecret);
    //     const cookieName = this.AUTH_COOKIE_NAME;

    //     return (req: HttpRequest, res: HttpResponse) => {
    //         if (token) {
    //             res.cookie(cookieName, token,
    //                 { httpOnly: true, signed: true, sameSite: "strict" }
    //             );
    //             return true;
    //         } else {
    //             return false;
    //         }
    //     };
    // }

    public digestPassword(pass: string): string {
        return crypto.createHmac('sha256', this.app.config.authSecret)
            .update(`${pass} - ${this.app.config.authSalt}`)
            .digest('hex');
    }

    /**
     * Express middleware for user authentication
     * we could do the autentication in our application layer but for now let's bind to express
     * @param req Http Request object with data
     * @param resp Http Response object for information
     * @param next Function to execute
     */
    public process(req: HttpRequest, resp: HttpResponse, next: NextFunc): void {

        if (req.signedCookies[this.AUTH_COOKIE_NAME]) {
            try {
                req.user = jwt.verify(req.signedCookies[this.AUTH_COOKIE_NAME], this.app.config.sessionSecret) as IUserToken;
            } catch (ex) {
                next();
            }
        } else {
            next();
        }
    }
}