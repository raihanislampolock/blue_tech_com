import { AppDataSource } from "../../../../init"; // Postgres
import moment from "moment-timezone";

export class EmailConfigRepository {
    // ✅ Create new email config
    public async create(data: any): Promise<any> {
        try {
            const query = `
              INSERT INTO internal_portal_db.public.email_config
                ("type", email, "appPassword", "isActive", "createdBy", "createdAt")
              VALUES ($1, $2, $3, $4, $5, NOW())
              RETURNING id
            `;

            const params = [
                data.type,
                data.email,
                data.appPassword,
                data.isActive,
                data.createdBy,
            ];

            const result = await AppDataSource.query(query, params);
            return {
                status: true,
                message: "Email config created successfully",
                id: result[0]?.id,
            };
        } catch (error) {
            console.error("Error creating email config:", error);
            throw new Error("Failed to create email config");
        }
    }

    // ✅ Edit (fetch one record with user info)
    public async edit(id: number): Promise<any> {
        try {
            const query = `
              SELECT
                ec.id,
                ec."type",
                ec.email,
                ec."appPassword",
                ec."isActive",
                ec."createdAt",
                ec."updatedAt",
                ec."createdBy",
                ec."updatedBy",
                u.username AS createdByName
              FROM internal_portal_db.public.email_config ec
              LEFT JOIN users u ON ec."createdBy" = u."userId"
              WHERE ec.id = $1
              LIMIT 1
            `;

            const result = await AppDataSource.query(query, [id]);
            return result[0];
        } catch (error) {
            console.error("Error fetching email config for edit:", error);
            throw new Error("Failed to fetch email config");
        }
    }

    // ✅ Update existing record
    public async update(id: number, data: any): Promise<any> {
        try {
            const query = `
              UPDATE internal_portal_db.public.email_config
              SET
                "type" = $2,
                email = $3,
                "appPassword" = $4,
                "isActive" = $5,
                "updatedBy" = $6,
                "updatedAt" = NOW()
              WHERE id = $1
            `;

            const params = [
                id,
                data.type,
                data.email,
                data.appPassword,
                data.isActive,
                data.updatedBy,
            ];

            await AppDataSource.query(query, params);
            return { status: true, message: "Email config updated successfully" };
        } catch (error) {
            console.error("Error updating email config:", error);
            throw new Error("Failed to update email config");
        }
    }

    // ✅ Get all records with pagination + search
    public async getAll(page: number, limit: number, search: string = "") {
        const offset = (page - 1) * limit;
        const params: any[] = [];

        let whereSQL = "";
        if (search) {
            params.push(`%${search}%`);
            whereSQL = `WHERE ec."type" ILIKE $${params.length} OR ec.email ILIKE $${params.length}`;
        }

        const query = `
          SELECT
            ec.id,
            ec."type",
            ec.email,
            ec."appPassword",
            ec."isActive",
            ec."createdAt",
            ec."updatedAt",
            ec."createdBy",
            ec."updatedBy",
            uu.username as "userName",
            u.username
          FROM internal_portal_db.public.email_config ec
          LEFT JOIN users u ON ec."createdBy" = u."userId"
          LEFT JOIN users uu ON ec."updatedBy" = uu."userId"
          ${whereSQL}
          ORDER BY ec.id DESC
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;

        const countQuery = `
          SELECT COUNT(ec.id) AS total
          FROM internal_portal_db.public.email_config ec
          ${whereSQL}
        `;

        const data = await AppDataSource.query(query, [...params, limit, offset]);
        const countResult = await AppDataSource.query(countQuery, params);

        const total = parseInt(countResult[0]?.total || "0", 10);
        const totalPages = Math.ceil(total / limit);

        return { data, total, totalPages, currentPage: page };
    }
}
