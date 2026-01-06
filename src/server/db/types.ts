interface Category {
    id: number;
    name: string;
    default: boolean;
}

interface Tricount {
    id: number;
    name: string;
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
    userPayer: User;
    date: string;
    usersPayees: TricountPayee[];
}

interface MeUser {
    token: string;
    username: string;
    picture: string | null;
    type: string | null;
}

interface User {
    username: string;
    picture: string | null;
    type: string | null;
}

interface TricountPayee extends User {
    amount: number;
}

export type { Category, Tricount, TricountInteraction, TricountPayee, MeUser, User };