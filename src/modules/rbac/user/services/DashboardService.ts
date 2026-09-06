import { IDashboardService } from "../interfaces/IDashboardService";
import { DashboardRepository } from "../repositories/DashboardRepository";

export class DashboardService implements IDashboardService {
  private dashboardRepo: DashboardRepository;

  constructor() {
    this.dashboardRepo = new DashboardRepository();
  }

  async getTotalUserCount(): Promise<number> {
    return await this.dashboardRepo.countTotalUsers();
  }
}
