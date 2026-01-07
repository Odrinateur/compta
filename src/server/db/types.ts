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
    usernamePayer: string;
    date: string;
    usersPayees: TricountPayeeLight[];
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

interface UserLight {
    username: string;
}

interface TricountPayee extends User {
    amount: number;
}

interface TricountPayeeLight {
    username: string;
    amount: number;
}

export type {
    Category,
    Tricount,
    TricountInteraction,
    TricountPayeeLight,
    TricountPayee,
    MeUser,
    User,
    UserLight,
};
