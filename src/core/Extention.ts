import { Middleware } from "./Middleware";
import { HttpRequest, HttpResponse, NextFunc } from "./Types";

/**
 * Whole purpose of extension is to add support for additional funationalities in HttpRequest and HttpResponse
 */
export class Extention extends Middleware {

    public process(req: HttpRequest, resp : HttpResponse, next: NextFunc) : void {

        // Extend response with bag and view
        resp.bag = {};
        resp.view = (view: string, options?: object, callback?: (err: Error, html: string) => void) => {
            resp.bag = options? { ...resp.bag, ...options} : resp.bag;
            resp.render(view, resp.bag, callback);
        };

        next();
    }
}