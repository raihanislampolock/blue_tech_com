
// System
import path from "path";
import fs from "fs";
import { exit } from "process";
import cookieParser from 'cookie-parser';
import express from "express";

// Core
// import { mongoInit } from "./init";
import { Application } from "./core/Application";
import { Config } from "./core/Config";
import { Role } from "./core/IUserProvider";
import cron from "node-cron";
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io } from "./socket";
import { initSocket } from "./socket";

// Formatters
import { dateFormatter } from "./ftms/date";

// Controllers
import { LoginService } from "./modules/rbac/user/services/LoginService";
import { LoginController } from "./modules/rbac/user/controllers/LoginController";
import { UserRepository } from "./modules/rbac/user/repositories/UserRepository";
import { AppDataSource, initializeDatabase } from "./init";
import { SignUpController } from "./modules/rbac/user/controllers/SignUpController";
import { SignUpService } from "./modules/rbac/user/services/SignUpService";
import { RoleController } from "./modules/rbac/role/controllers/role.controller";
import { RoleRepository } from "./modules/rbac/role/repositories/role.repository";
import { RoleService } from "./modules/rbac/role/services/role.service";
import { userContext } from "./middlewares/userContext";
import { DashboardController } from "./modules/rbac/user/controllers/DashboardController";
import { DashboardRepository } from "./modules/rbac/user/repositories/DashboardRepository";
import { DashboardService } from "./modules/rbac/user/services/DashboardService";
import { PermissionController } from "./modules/rbac/permission/controllers/permission.controller";
import { PermissionService } from "./modules/rbac/permission/services/permission.service";
import { PermissionRepository } from "./modules/rbac/permission/repositories/permission.repositorie";
import { EmailConfigController } from "./modules/it/email-admin/controllers/email.config.controller";
import { EmailConfigRepository } from "./modules/it/email-admin/repositories/email.config.repository";
import { EmailConfigService } from "./modules/it/email-admin/services/email.config.service";
import { BlueTechItemsController } from "./modules/blue_tech/controllers/blue_tech_item_controller";
import { BlueTechItemsService } from "./modules/blue_tech/services/blue_tech_item_service";
import { BlueTechItemsRepository } from "./modules/blue_tech/repositories/blue_tech_item_repository";
import { BlueTechPurchaseRepository } from "./modules/blue_tech/repositories/blue_tech_purchase_repository";
import { BlueTechPurchaseService } from "./modules/blue_tech/services/blue_tech_purchase_service";
import { BlueTechPurchaseController } from "./modules/blue_tech/controllers/blue_tech_purchase_controller";
import { BlueTechItemStockRepository } from "./modules/blue_tech/repositories/blue_tech_itemstock_repository";
import { BlueTechItemStockService } from "./modules/blue_tech/services/blue_tech_itemstock_service";
import { BlueTechItemStockController } from "./modules/blue_tech/controllers/blue_tech_itemstock_controller";
import { BlueTechSupplierService } from "./modules/blue_tech/services/blue_tech_supplier_service";
import { BlueTechSupplierRepository } from "./modules/blue_tech/repositories/blue_tech_supplier_repository";
import { BlueTechSupplierController } from "./modules/blue_tech/controllers/blue_tech_supplier_controller";
import { BlueTechPaymentMethodService } from "./modules/blue_tech/services/blue_tech_payment_method_service";
import { BlueTechPaymentMethodRepository } from "./modules/blue_tech/repositories/blue_tech_payment_method_repository";
import { BlueTechPaymentMethodController } from "./modules/blue_tech/controllers/blue_tech_payment_method_controller";
import { BlueTechAdvancePaymentController } from "./modules/blue_tech/controllers/blue_tech_advance_payment_dashboard_controller";
import { BlueTechAdvancePaymentService } from "./modules/blue_tech/services/blue_tech_advance_payment_dashboard_service";
import { BlueTechAdvancePaymentRepository } from "./modules/blue_tech/repositories/blue_tech_advance_payment_dashboard_repository";
import { BlueTechPurchaseOrderController } from "./modules/blue_tech/controllers/blue_tech_purchase_order_controller";
import { BlueTechPurchaseOrderService } from "./modules/blue_tech/services/blue_tech_purchase_order_service";
import { BlueTechPurchaseOrderRepository } from "./modules/blue_tech/repositories/blue_tech_purchase_order_repository";
import { BlueTechCustomerRepository } from "./modules/blue_tech/repositories/blue_tech_customer_repository";
import { BlueTechCustomerService } from "./modules/blue_tech/services/blue_tech_customer_service";
import { BlueTechCustomerController } from "./modules/blue_tech/controllers/blue_tech_customer_controller";
import { BlueTechInvoiceRepository } from "./modules/blue_tech/repositories/blue_tech_invoice_repository";
import { BlueTechInvoiceService } from "./modules/blue_tech/services/blue_tech_invoice_service";
import { BlueTechInvoiceController } from "./modules/blue_tech/controllers/blue_tech_invoice_controller";
import { BlueTechInvoiceReturnRepository } from "./modules/blue_tech/repositories/blue_tech_invoice_return_repository";
import { BlueTechInvoiceReturnService } from "./modules/blue_tech/services/blue_tech_invoice_return_service";
import { BlueTechInvoiceReturnController } from "./modules/blue_tech/controllers/blue_tech_invoice_return_controller";
import { BlueTechPurchaseReturnRepository } from "./modules/blue_tech/repositories/blue_tech_purchase_return_repository";
import { BlueTechPurchaseReturnService } from "./modules/blue_tech/services/blue_tech_purchase_return_service";
import { BlueTechPurchaseReturnController } from "./modules/blue_tech/controllers/blue_tech_purchase_return_controller";

// config
const CONFIG_FILE = "config.json";

if (!fs.existsSync(CONFIG_FILE)) {
    console.warn(`Can't find '${CONFIG_FILE}' please make sure config file is present in the current directory`);
    exit(0);
}

const APP_CONFIG: Config = new Config(JSON.parse(fs.readFileSync(CONFIG_FILE).toString()));

// Initialize mongo db
// mongoInit(APP_CONFIG.mongoUrl);

const app = Application.getInstance(APP_CONFIG);

app.viewDir("views");
app.viewEngine("pug");
app.setStatic(path.join(__dirname, "public"), { maxAge: 0 }); // 31557600000 turned off caching for now
app.getExpressApp().use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'))
);
app.use(userContext);

// Setup menu
app.setMenu("main", {
    items: [
        { name: "Dashboard", path: "/", for: [Role.Admin] },
        { name: "Report", path: "/report/weight-data", for: [Role.Admin, Role.Agent, Role.Customer] },
        { name: "RMS Items", path: "/rms/rms-items", for: [Role.Admin] },
        { name: "RMS Stock", path: "/rms/rms-stock", for: [Role.Admin] },
        { name: "RMS Purchases", path: "/rms/rms-purchase", for: [Role.Admin] },
        { name: "RMS Quotations", path: "/rms/rms-quotation", for: [Role.Admin] },
        { name: "RMS Deliveries", path: "/rms/rms-delivery", for: [Role.Admin] },
        { name: "RMS Challans", path: "/rms/rms-challan", for: [Role.Admin] },
        { name: "RMS Invoices", path: "/rms/rms-invoice", for: [Role.Admin] },
        { name: "<i class='large material-icons'>admin_panel_settings</i>", path: "/role-permissions", for: [Role.Admin] },
        { name: "<i class='large material-icons'>people</i>", path: "/users", for: [Role.Admin] },
        { name: "<i class='large material-icons'>security</i>", path: "/password/change", for: [Role.Admin] },
        { name: "<i class='large material-icons'>exit_to_app</i>", path: "/logout", for: [Role.Admin] }
    ]
})

// Add any formatters, you can access it by fmt.date in views like fmt.date.ymd()
app.setFormatter("date", dateFormatter);


app.set("UserRepository", new UserRepository());
app.set("RoleRepository", new RoleRepository());
app.set("DashboardRepository", new DashboardRepository());
app.set("PermissionRepository", new PermissionRepository());
app.set("EmailConfigRepository", new EmailConfigRepository());
app.set("BlueTechItemsRepository", new BlueTechItemsRepository());
app.set("BlueTechPurchaseRepository", new BlueTechPurchaseRepository());
app.set("BlueTechItemStockRepository", new BlueTechItemStockRepository());
app.set("BlueTechSupplierRepository", new BlueTechSupplierRepository());
app.set("BlueTechPaymentMethodRepository", new BlueTechPaymentMethodRepository());
app.set("BlueTechAdvancePaymentRepository", new BlueTechAdvancePaymentRepository());
app.set("BlueTechPurchaseOrderRepository", new BlueTechPurchaseOrderRepository());
app.set("BlueTechCustomerRepository", new BlueTechCustomerRepository());
app.set("BlueTechInvoiceRepository", new BlueTechInvoiceRepository());
app.set("BlueTechInvoiceReturnRepository", new BlueTechInvoiceReturnRepository());
app.set("BlueTechPurchaseReturnRepository", new BlueTechPurchaseReturnRepository());



app.set("SignUpService", new SignUpService(app.get("UserRepository"), AppDataSource));
app.set("LoginService", new LoginService(app.get("UserRepository")));
app.set("RoleService", new RoleService(app.get("RoleRepository")));
app.set("DashboardService", new DashboardService());
app.set("PermissionService", new PermissionService(app.get("PermissionRepository"), AppDataSource));
app.set("EmailConfigService", new EmailConfigService());
app.set("BlueTechItemsService", new BlueTechItemsService(app.get("BlueTechItemsRepository")));
app.set("BlueTechItemStockService", new BlueTechItemStockService(app.get("BlueTechItemStockRepository")));
app.set("BlueTechPurchaseService", new BlueTechPurchaseService(app.get("BlueTechPurchaseRepository")));
app.set("BlueTechSupplierService", new BlueTechSupplierService(app.get("BlueTechSupplierRepository")));
app.set("BlueTechPaymentMethodService", new BlueTechPaymentMethodService(app.get("BlueTechPaymentMethodRepository")));
app.set("BlueTechAdvancePaymentService", new BlueTechAdvancePaymentService(app.get("BlueTechAdvancePaymentRepository")));
app.set("BlueTechPurchaseOrderService", new BlueTechPurchaseOrderService(app.get("BlueTechPurchaseOrderRepository")));
app.set("BlueTechCustomerService", new BlueTechCustomerService(app.get("BlueTechCustomerRepository")));
app.set("BlueTechInvoiceService", new BlueTechInvoiceService(app.get("BlueTechInvoiceRepository")));
app.set("BlueTechInvoiceReturnService", new BlueTechInvoiceReturnService(app.get("BlueTechInvoiceReturnRepository")));
app.set("BlueTechPurchaseReturnService", new BlueTechPurchaseReturnService(app.get("BlueTechPurchaseReturnRepository")));


// Initialize and set the mailer to use
// const Mailer = new SMTPMailer(APP_CONFIG.smtp);
// app.set("Mailer", Mailer);

app.registerController(new SignUpController());
app.registerController(new LoginController());
// DashboardController will be registered after socket initialization
app.registerController(new RoleController());
app.registerController(new PermissionController());
app.registerController(new EmailConfigController());
app.registerController(new BlueTechItemsController());
app.registerController(new BlueTechItemStockController());
app.registerController(new BlueTechPurchaseController());
app.registerController(new BlueTechSupplierController());
app.registerController(new BlueTechPaymentMethodController());
app.registerController(new BlueTechAdvancePaymentController());
app.registerController(new BlueTechPurchaseOrderController());
app.registerController(new BlueTechCustomerController());
app.registerController(new BlueTechInvoiceController());
app.registerController(new BlueTechInvoiceReturnController());
app.registerController(new BlueTechPurchaseReturnController());




// Initialize database and then start the app
initializeDatabase()
    .then(async () => {

        // Start the Express server after the database connection is successful
        // Get the Express app
        const expressApp = app.getExpressApp();

        // Create HTTP server
        const server = createServer(expressApp);

        // Initialize Socket.IO
        const socketIO = initSocket(server);
        app.set('io', socketIO);

        // Register DashboardController after socket initialization
        app.registerController(new DashboardController(socketIO));

        // Start listening
        server.listen(APP_CONFIG.port, () => {
            console.log(`Server started at http://localhost:${APP_CONFIG.port}`);
        });
    })
    .catch(err => {
        console.error('Error during application setup:', err);
        process.exit(1); // Exit the process if initialization fails
    });

