import { AppDataSource } from "../../../init";
import { IBlueTechCustomer, IBlueTechCustomerRepository } from "../interfaces/blue_tech_customer_interface";
import { BlueTechCustomerModel } from "../models/blue_tech_customer_model";

export class BlueTechCustomerRepository implements IBlueTechCustomerRepository {
    private customerRepo = AppDataSource.getRepository(BlueTechCustomerModel);

    public async create(data: IBlueTechCustomer): Promise<BlueTechCustomerModel> {
        const name = String(data.customerName || "").trim();
        if (!name) throw new Error("Customer name is required");

        const customer = this.customerRepo.create({
            customerName: name,
            phoneNumber: data.phoneNumber || null,
            email: data.email || null,
            taxNumber: data.taxNumber || null,
            billingAddress: data.billingAddress || null,
            notes: data.notes || null,
            isActive: data.isActive !== false,
            createdBy: data.createdBy || "system"
        });
        return this.customerRepo.save(customer);
    }

    public async getAll(search = "", page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        const whereSql = search
            ? `WHERE c."customerName" ILIKE $1 OR c."phoneNumber" ILIKE $1 OR c.email ILIKE $1 OR c."taxNumber" ILIKE $1 OR c."billingAddress" ILIKE $1`
            : "";
        if (search) params.push(`%${search}%`);

        const data = await AppDataSource.query(`
            SELECT c.id, c."customerName", c."phoneNumber", c.email, c."taxNumber",
                   c."billingAddress", c.notes, c."isActive", u."empId" AS "createdBy",
                   u2."empId" AS "updatedBy", c.created_at, c.updated_at
            FROM public.blue_tech_customers c
            LEFT JOIN public.users u ON c."createdBy" = u."userId"
            LEFT JOIN public.users u2 ON c."updatedBy" = u2."userId"
            ${whereSql}
            ORDER BY c.created_at DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset]);

        const count = await AppDataSource.query(`SELECT COUNT(c.id) AS total FROM public.blue_tech_customers c ${whereSql}`, params);
        const total = Number(count[0]?.total || 0);
        return { data, total, totalPages: Math.ceil(total / limit), currentPage: page };
    }

    public async edit(id: number): Promise<IBlueTechCustomer | null> {
        const result = await AppDataSource.query(`
            SELECT id, "customerName", "phoneNumber", email, "taxNumber", "billingAddress",
                   notes, "isActive", "createdBy", "updatedBy", created_at, updated_at
            FROM public.blue_tech_customers WHERE id = $1 LIMIT 1
        `, [id]);
        return result[0] || null;
    }

    public async update(id: number, data: Partial<IBlueTechCustomer>): Promise<any> {
        const name = String(data.customerName || "").trim();
        if (!name) throw new Error("Customer name is required");
        const result = await AppDataSource.query(`
            UPDATE public.blue_tech_customers
            SET "customerName" = $2, "phoneNumber" = $3, email = $4, "taxNumber" = $5,
                "billingAddress" = $6, notes = $7, "isActive" = $8, "updatedBy" = $9,
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, "customerName", "phoneNumber", email, "taxNumber", "billingAddress", notes, "isActive"
        `, [id, name, data.phoneNumber || null, data.email || null, data.taxNumber || null,
            data.billingAddress || null, data.notes || null, data.isActive !== false, data.updatedBy || "system"]);
        if (!result.length) throw new Error("Customer not found");
        return result[0];
    }
}
