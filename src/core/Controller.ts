import { Application } from "./Application";
import { ActionCallback, HttpMethods } from "./Action";
import { Role } from "./IUserProvider";
import { PathParam } from "./Types";

export class Controller {
    protected prefix: string = "";
    private app: Application;

    constructor() {
        this.app = Application.getInstance(); // Singleton pattern for application access
    }

    // Method to retrieve any service from the app container
    protected getService<T>(serviceName: string): T {
        return this.app.get(serviceName) as T;
    }

    /**
     * Registers the controller and initializes services.
     * @param application The application instance.
     */
    public Register(application: Application): void {
        this.app = application;

        // Set registered services as properties
        for (const key of application.getServiceNames()) {
            Object.defineProperty(this, key, {
                get() {
                    return application.get(key);
                }
            });
        }

        this.onRegister();
    }

    /**
     * Override this method to register routes.
     */
    public onRegister(): void {
        // Shall override
    }

    /**
     * Register a GET route.
     * @param route The route to match.
     * @param middlewares Optional array of middleware functions.
     * @param callback The function to call.
     * @param roles Optional array of roles.
     */
    public onGet(route: string, middlewares: any[] = [], auth: boolean, callback: ActionCallback): void {
        this.registerAction(HttpMethods.GET, route, middlewares, auth, callback);
    }

    /**
     * Register a POST route.
     * @param route The route to match.
     * @param middlewares Optional array of middleware functions.
     * @param callback The function to call.
     * @param roles Optional array of roles.
     */
    public onPost(route: string, middlewares: any[] = [], auth: boolean, callback: ActionCallback): void {
        this.registerAction(HttpMethods.POST, route, middlewares, auth, callback);
    }

    /**
     * Register a PUT route.
     * @param route The route to match.
     * @param middlewares Optional array of middleware functions.
     * @param callback The function to call.
     * @param roles Optional array of roles.
     */
    public onPut(route: string, middlewares: any[] = [], auth: boolean, callback: ActionCallback): void {
        this.registerAction(HttpMethods.PUT, route, middlewares, auth, callback);
    }

    /**
     * Register a PATCH route.
     * @param route The route to match.
     * @param middlewares Optional array of middleware functions.
     * @param callback The function to call.
     * @param roles Optional array of roles.
     */
    public onPatch(route: string, middlewares: any[] = [], auth: boolean, callback: ActionCallback): void {
        this.registerAction(HttpMethods.PATCH, route, middlewares, auth, callback);
    }

    /**
     * Register a DELETE route.
     * @param route The route to match.
     * @param middlewares Optional array of middleware functions.
     * @param callback The function to call.
     * @param roles Optional array of roles.
     */
    public onDelete(route: string, middlewares: any[] = [], auth: boolean, callback: ActionCallback): void {
        this.registerAction(HttpMethods.DELETE, route, middlewares, auth, callback);
    }

    /**
     * Registers an action with the application.
     * @param method The HTTP method.
     * @param route The route to match.
     * @param middlewares Optional array of middleware functions.
     * @param callback The function to call.
     * @param roles Optional array of roles.
     */
    public registerAction(
        method: HttpMethods,
        route: PathParam,
        middlewares: any[] = [], // Default to an empty array
        auth: boolean,
        callback?: ActionCallback
    ): void {
        const fullRoute = this.prefix + route;

        // Ensure callback is always the last argument passed to registerAction
        if (typeof middlewares === 'function') {
            callback = middlewares;
            middlewares = [];
        }

        this.app.registerAction(this, method, fullRoute, middlewares, auth, callback);
    }
}
