interface Category {
    id: number;
    name: string;
    default: boolean;
}

interface Tricount {
    id: number;
    name: string;
}

interface User {
    token: string;
    username: string;
}

type Role = "owner" | "writer" | "reader";
type RoleWithAny = Role | "any";
type RoleWithoutOwner = "writer" | "reader";
const roleHierarchy: Record<Role, number> = {
    owner: 3,
    writer: 2,
    reader: 1,
};

export type { Category, Tricount, User, Role, RoleWithAny, RoleWithoutOwner };
export { roleHierarchy };