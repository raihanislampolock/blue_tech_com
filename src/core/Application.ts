import { ActionCallback, HttpMethods } from "./Action";
import { Dictionary } from "./Dictionary";
import { Controller } from "./Controller";
import express, { Express } from "express";
import { Role, IUserProvider } from "./IUserProvider";
import { NextFunc, HttpRequest, HttpResponse, PathParam } from "./Types";
import { Authenticator } from "./Authenticator";
import { Session } from "./Session";
import CookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { Config } from "./Config";
import { Middleware } from "./Middleware";
import { Extention } from "./Extention";
import { Menu } from "./Menu";
import { IMailer } from "./IMailer";
import cors from 'cors';
import session from 'express-session';
import { errorHandler, notFoundHandler } from "../middlewares/error-handler.middleware";
import jwt from "jsonwebtoken";
import { createResponse } from "../utils/response";
import { RequestHandler } from "express";


export class Application {
    private static instance: Application;
    private services: Dictionary<any>;
    private Controllers: Controller[];
    private menus: Dictionary<Menu>;
    private formatters: Dictionary<any>;
    private globalPrefix: string;

    // Injected dependencies
    public UserProvider: IUserProvider;
    public Express: Express;    // Public in case we need to add additional customization from app.ts
    public Mailer: IMailer;
    private Authenticator: Authenticator;
    private Session: Session;

    public constructor(public config: Config, globalPrefix: string = "") {
        this.globalPrefix = globalPrefix;
        this.services = new Dictionary<any>();
        this.Controllers = new Array<Controller>();
        this.menus = new Dictionary<Menu>();
        this.formatters = new Dictionary<any>();

        // Create an express app and bind to our system
        this.set("Express", express());

        this.Express.use(cors());

        // Parse incoming request bodies
        this.Express.use(bodyParser.json());
        this.Express.use(bodyParser.urlencoded({ extended: true }));
        this.Express.use(CookieParser(config.cookieSecret));

        this.Express.use(session({
            secret: this.config.sessionSecret,  // Use a secret key from your config
            resave: false,  // Avoid resaving sessions unnecessarily
            saveUninitialized: true,  // Save new sessions even if they haven't been modified
            cookie: { secure: false }  // Set to `true` if using HTTPS
        }));

        // Make session available to all controllers
        this.set("Session", new Session());
        this.set("Authenticator", new Authenticator(this));
        this.set("config", config);

        // Register session middleware
        this.use(new Extention());
        this.use(this.Session);
        this.use(this.Authenticator);
    }

    // Static method to retrieve or create the instance
    public static getInstance(config?: Config, globalPrefix: string = ""): Application {
        if (!Application.instance) {
            if (!config) {
                throw new Error("Application instance not initialized yet, config is required.");
            }
            Application.instance = new Application(config, globalPrefix);
        }
        return Application.instance;
    }

    public registerAction(context: Controller, method: HttpMethods, route: PathParam, middlewares: any[] = [], auth: boolean, callback: ActionCallback): void {

        const wrappedCb = this.execute(context, callback, auth);
        const fullRoute = `${this.globalPrefix}${route}`;

        switch (method) {
            case HttpMethods.GET:
                this.Express.get(fullRoute, ...middlewares, wrappedCb);
                break;
            case HttpMethods.POST:
                this.Express.post(fullRoute, ...middlewares, wrappedCb);
                break;
            case HttpMethods.PUT:
                this.Express.put(fullRoute, ...middlewares, wrappedCb);
                break;
            case HttpMethods.PATCH:
                this.Express.patch(fullRoute, ...middlewares, wrappedCb);
                break;
            case HttpMethods.DELETE:
                this.Express.delete(fullRoute, ...middlewares, wrappedCb);
                break;
        }
    }

    public registerController(controller: Controller): void {
        controller.Register(this);
        this.Controllers.push(controller);
    }

    private execute(context: Controller, callback: ActionCallback, auth: boolean) {
        return (req: HttpRequest, resp: HttpResponse, next: NextFunc) => {
            if (auth === true) {
                const token = req.cookies.auth_token;

                const isApiRequest =
                    String(req.originalUrl || req.url)
                        .startsWith('/api/') ||
                    String(req.headers.accept || '')
                        .includes('application/json');

                const unauthorized = (message: string) => {
                    if (isApiRequest) {
                        return resp.status(401).json({
                            status: false,
                            message,
                            data: null
                        });
                    }

                    resp.bag.errorMessage = message;
                    return resp.view('login');
                };

                if (!token) {
                    return unauthorized('Session expired. Please log in.');
                }

                jwt.verify(token, this.config.authSecret as string, (err: any, user: any) => {
                    if (err) {
                        return unauthorized('Invalid or expired token. Please log in again.');
                    }
                    req.user = user;
                    // this.populateBag(req, resp);
                    callback.call(context, req, resp, next);
                });
            } else {
                callback.call(context, req, resp, next);
            }
        };
    }

    // private populateBag(req: HttpRequest, resp: HttpResponse) {
    //     if (!resp.bag.menu) resp.bag.menu = { main: { items: [] } };
    //     for (const key of this.menus.Keys()) {
    //         const menu = { items: this.menus.Item(key).items.filter(mi => mi.for.length === 0 || (req.user && mi.for.indexOf(req.user.role) >= 0)) };
    //         resp.bag.menu[key] = menu;
    //     }
    // }

    public setFormatter(name: string, value: unknown) {
        this.formatters.Add(name, value);
    }

    public use(middleware: Middleware | RequestHandler | (Middleware | RequestHandler)[]): void {
        if (Array.isArray(middleware)) {
            middleware.forEach(mw => this.use(mw));
            return;
        }

        if (typeof (middleware as any).process === 'function') {
            // Your custom Middleware object with process()
            this.Express.use((req: HttpRequest, resp: HttpResponse, next: NextFunc) => {
                (middleware as Middleware).process(req, resp, next);
            });
        } else {
            // It's an Express middleware function
            this.Express.use(middleware as RequestHandler);
        }
    }


    public setStatic(root: string, options?: {}) {
        this.Express.use(express.static(root, options));
    }

    public viewDir(root: string): void {
        this.Express.set("views", root);
    }

    public viewEngine(name: string): void {
        this.Express.set("view engine", name);
    }

    public setMenu(name: string, menu: Menu): void {
        this.menus.Add(name, menu);
    }

    public getMenu(name: string): Menu {
        return this.menus.Item(name);
    }

    public set(name: string, value: unknown): void {
        this.services.Add(name, value);
        Object.defineProperty(this, name, {
            get() {
                return value;
            }
        });

        for (const controller of this.Controllers) {
            Object.defineProperty(controller, name, {
                get() {
                    return value;
                }
            });
        }
    }

    public get<T>(name: string): T {
        if (this.services.ContainsKey(name)) {
            return this.services.Item(name);
        }
    }

    public getServiceNames(): string[] {
        return this.services.Keys();
    }

    public listen(port: number, callback?: (...args: any[]) => void): void {
        this.Express.listen(port, callback);
    }

    public setupHandlers(): void {
        this.Express.use(notFoundHandler);
        this.Express.use(errorHandler);
    }

    public getExpressApp(): Express {
        return this.Express;
    }
}
