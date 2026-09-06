import { Controller } from "../../../../core/Controller";
import { NextFunc, HttpRequest, HttpResponse } from "../../../../core/Types";
import { DashboardService } from "../services/DashboardService";
import { Server as SocketIOServer } from "socket.io";
import { emitDashboardUpdate } from "../../../../socket";

export class DashboardController extends Controller {
    private auth = { private: true, public: false };
    private dashboardService: DashboardService;
    private io: SocketIOServer;

    constructor(io: SocketIOServer) {
        super();
        this.io = io;
        this.dashboardService = new DashboardService();
    }

    public onRegister(): void {
        this.onGet("/dashboard", [], this.auth.private, this.index);
        this.onGet("/dashboard/medical", [], this.auth.private, this.medicalDashboard);
        this.onPost("/dashboard/test-socket", [], this.auth.private, this.testSocket);
        this.onGet("/dashboard/medicalserviceadmin", [], this.auth.private, this.medicalserviceadminDashboard);
    }

    public index = async (req: HttpRequest, res: HttpResponse, next: NextFunc) => {
        try {
            res.bag.pageTitle = "Rms Tech Solutions | Dashboard";

            const totalUsers = await this.dashboardService.getTotalUserCount();

            const confirmedData: number[] = Array(12).fill(0);
            const pendingData: number[] = Array(12).fill(0);

            const imagingtotal: number[] = Array(12).fill(0);
            const prescriptiontotal: number[] = Array(12).fill(0);

            const stats: any = {
                total_sessions: 1,
                today_sessions: 2,
                total_users: totalUsers,
            };

            res.bag.stats = stats;
            res.bag.confirmedData = confirmedData;
            res.bag.pendingData = pendingData;
            res.bag.imagingtotal = imagingtotal;
            res.bag.prescriptiontotal = prescriptiontotal;

            // --- Emit to clients via socket.io ---
            if (this.io) {
                this.io.emit("dashboard:update", {
                    stats,
                    confirmedData,
                    pendingData,
                    imagingtotal,
                    prescriptiontotal
                });
            }

            // Emit role-specific dashboard updates
            const userRole = (req.user?.roleName || '').toLowerCase().trim();

            emitDashboardUpdate(userRole, {
                type: 'dashboard-data-update',
                stats,
                confirmedData,
                pendingData,
                imagingtotal,
                prescriptiontotal,
                userId: req.user?.userId
            });

            let dashboardView = 'dashboard/admin';
            if (['medicalservice', 'nurse', 'doctor', 'medicaltranscriptionist'].includes(userRole)) {
                dashboardView = 'dashboard/medical';
            } else if (userRole === 'finance') {
                dashboardView = 'dashboard/finance';
            } else if (['callcenter'].includes(userRole)) {
                dashboardView = 'dashboard/contacecenter';
            } else if (['fde'].includes(userRole)) {
                dashboardView = 'dashboard/ops';
            } else if (['opsadmin'].includes(userRole)) {
                dashboardView = 'dashboard/opsadmin';
            } else if (['pms'].includes(userRole)) {
                dashboardView = 'dashboard/pms';
            } else if (['callcenteradmin', 'fdeadmin'].includes(userRole)) {
                dashboardView = 'dashboard/contacecenteradmin';
            } else if (['user', 'agent', 'customer' ].includes(userRole)) {
                dashboardView = 'dashboard/user';
            } else if (['marketing' ].includes(userRole)) {
                dashboardView = 'dashboard/marketing';
            } else if (userRole === 'sales') {
                dashboardView = 'dashboard/sales';
            } else if (userRole === 'deo') {
                dashboardView = 'dashboard/lab';
            } else if (['qmt' ].includes(userRole)) {
                dashboardView = 'dashboard/qmt';
            } else if (userRole === 'medicalserviceadmin') {
                dashboardView = 'dashboard/medicalserviceadmin';
            } else if (userRole === 'vsdoctor') {
                dashboardView = 'dashboard/vsdoctor';
            } else if (userRole === 'radiologist') {
                dashboardView = 'dashboard/radiology';
            } else if (userRole === 'cmt') {
                dashboardView = 'dashboard/cmt';
            } else if (userRole === 'superadmin') {
                dashboardView = 'dashboard/admin';
            }

            return res.view(dashboardView);
        } catch (err) {
            next(err);
        }
    }

    // Medical Dashboard
    public medicalDashboard = async (req: HttpRequest, res: HttpResponse, next: NextFunc) => {
        try {
            res.bag.pageTitle = "Internal portal | Medical Dashboard";

            const totalUsers = await this.dashboardService.getTotalUserCount();

            const imagingtotal: number[] = Array(12).fill(0);
            const prescriptiontotal: number[] = Array(12).fill(0);


            const stats: any = {
                total_users: totalUsers
            };

            res.bag.stats = stats;
            res.bag.imagingtotal = imagingtotal;
            res.bag.prescriptiontotal = prescriptiontotal;


            res.view('dashboard/medical', {
              pageTitle: "Internal portal | Medical Dashboard",
              stats,
              imagingtotal,
              prescriptiontotal
            });
        } catch (err) {
            next(err);
        }
    }

    public medicalserviceadminDashboard = async (req: HttpRequest, res: HttpResponse, next: NextFunc) => {
        try {
            res.bag.pageTitle = "Rms Tech Solutions | Medical Service Admin Dashboard";

            const totalUsers = await this.dashboardService.getTotalUserCount();


            const imagingtotal: number[] = Array(12).fill(0);
            const prescriptiontotal: number[] = Array(12).fill(0);

            const stats: any = {
                total_users: totalUsers
            };

            res.bag.stats = stats;
            res.bag.imagingtotal = imagingtotal;
            res.bag.prescriptiontotal = prescriptiontotal;

            res.view('dashboard/medicalserviceadmin');
        } catch (err) {
            next(err);
        }
    }

    // Test socket functionality
    public testSocket = async (req: HttpRequest, res: HttpResponse, next: NextFunc) => {
        try {
            const userRole = (req.user?.roleName || '').toLowerCase().trim();
            const userId = req.user?.userId;

            // Emit a test update to all users with the same role
            emitDashboardUpdate(userRole, {
                type: 'test-update',
                message: 'This is a test socket update!',
                userId,
                timestamp: new Date().toISOString()
            });

            res.json({
                success: true,
                message: 'Test socket update sent',
                role: userRole,
                userId
            });
        } catch (err) {
            next(err);
        }
    }

}
