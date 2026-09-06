export interface IDashboardService {
    getTotalUserCount(): Promise<number>;
}

export interface IAppointmentRepository {
    countTotalUsers(): Promise<number>;
}
