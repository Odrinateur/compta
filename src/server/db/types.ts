interface Category {
    id: number;
    name: string;
    default: boolean;
}

interface Tricount {
    id: number;
    name: string;
}

interface TricountPayee {
    username: string;
    amount: number;
}

interface TricountInteraction {
    category: {
        id: number;
        name: string;
    };
    id: number;
    name: string;
    amount: number;
    categoryId: number;
    triId: number;
    isRefunded: boolean;
    userIdPayer: string;
    date: string;
    payees: TricountPayee[];
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

export type { Category, Tricount, TricountInteraction, TricountPayee, User, Role, RoleWithAny, RoleWithoutOwner };
export { roleHierarchy };