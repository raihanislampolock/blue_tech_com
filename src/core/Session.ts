
import { v4 as uuidv4 } from "uuid";
import { HttpRequest, HttpResponse, NextFunc } from "./Types";
import { Config } from "./Config";
import { Middleware } from "./Middleware";

export class Session extends Middleware {

    /**
     * Session initialization middleware for express
     */
    public process(req: HttpRequest, resp : HttpResponse, next: NextFunc): void {
        if(!req.signedCookies.__session) {
            resp.cookie("__session", this.createSession(), { path: "/", httpOnly: true, signed: true, sameSite: "strict" });
        }

        // Pass execution to the next
        next();
    }

    private createSession(): string {
        return JSON.stringify({ sessionId: uuidv4() , time: new Date() });
    }
}