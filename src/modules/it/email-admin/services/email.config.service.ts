import { EmailConfigRepository } from "../repositories/email.config.repository";

export class EmailConfigService {
    private repository: EmailConfigRepository;

    constructor() {
        this.repository = new EmailConfigRepository();
    }

    /**
     * 🔹 Create a new email config
     */
    public async create(data: any) {
        if (!data.type || !data.email || !data.appPassword) {
            throw new Error("Type, Email, and App Password are required");
        }

        return await this.repository.create(data);
    }

    /**
     * 🔹 Fetch single email config for editing
     */
    public async edit(id: number): Promise<any> {
        try {
            const emailConfig = await this.repository.edit(id);

            if (!emailConfig) {
                throw new Error(`No email config found with id: ${id}`);
            }

            return emailConfig;
        } catch (error) {
            console.error("Error fetching email config in service layer:", error);
            throw new Error("Error fetching email config");
        }
    }

    /**
     * 🔹 Update an existing email config
     */
    public async update(id: number, updateData: any): Promise<any> {
        try {
            const updatedRecord = await this.repository.update(id, updateData);

            if (!updatedRecord) {
                throw new Error(`Failed to update email config with id: ${id}`);
            }

            return updatedRecord;
        } catch (error) {
            console.error("Error updating email config in service layer:", error);
            throw new Error("Error updating email config");
        }
    }

    /**
     * 🔹 Get all email configs (with pagination + optional search)
     */
    public async getAll(page: number = 1, limit: number = 10, search: string = "") {
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;

        return await this.repository.getAll(page, limit, search);
    }
}
