
import { NextFunc, HttpResponse, HttpRequest } from "./Types";

export abstract class Middleware {
    public abstract process(req: HttpRequest, resp : HttpResponse, next: NextFunc) : void;
}