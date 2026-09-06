import { NextFunc, HttpRequest, HttpResponse } from "./Types";

export enum HttpMethods {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    PATCH = "PATCH",
    DELETE = "DELETE"
}

/**
 * Callback function interface for controller actions
 */
export type ActionCallback = (request: HttpRequest, response : HttpResponse, next: NextFunc)  => void