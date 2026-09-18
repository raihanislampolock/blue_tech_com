import { IBlueTechCustomer, IBlueTechCustomerRepository } from "../interfaces/blue_tech_customer_interface";

export class BlueTechCustomerService {
    constructor(private customerRepository: IBlueTechCustomerRepository) {}

    public async create(data: IBlueTechCustomer): Promise<any> {
        return this.customerRepository.create(data);
    }

    public async getAll(search: string, page: number, limit: number): Promise<any> {
        return this.customerRepository.getAll(search, page, limit);
    }

    public async edit(id: number): Promise<any> {
        const customer = await this.customerRepository.edit(id);
        if (!customer) throw new Error("Customer not found");
        return customer;
    }

    public async update(id: number, data: Partial<IBlueTechCustomer>): Promise<any> {
        return this.customerRepository.update(id, data);
    }
}
