import { Role } from "./IUserProvider";


export interface MenuItem {
    name: string,       // Appears in the name
    path: string,       // URL path for the menu
    for?: Role[],       // Who is allowed to access the menu
    icon?: string       // If any (Supports materialize icon)
}

export interface Menu {
    items: MenuItem[]
}