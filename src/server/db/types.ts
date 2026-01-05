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

export type { Category, Tricount, User };