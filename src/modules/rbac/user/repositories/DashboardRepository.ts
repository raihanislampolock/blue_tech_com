import { AppDataSource } from "../../../../init";
import { IAppointmentRepository } from "../interfaces/IDashboardService";

export class DashboardRepository implements IAppointmentRepository {
    async countTotalUsers(): Promise<number> {
        const result = await AppDataSource.query(`SELECT COUNT(id) AS total FROM public.users`);
        return parseInt(result[0]?.total || "0", 10);
    }
}
