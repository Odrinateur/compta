interface Tricount {
    id: number;
    name: string;
}

interface TricountInteraction {
    category: TricountCategory;
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

interface TricountCategory {
    id: number;
    name: string;
}

interface TricountCategoryRegex extends TricountCategory {
    regexes: {
        id: number;
        regex: string;
    }[];
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

interface CountCategory {
    id: number;
    name: string;
}

interface CountInteraction {
    id: number;
    name: string;
    amount: number;
    category: CountCategory;
    categoryId: number;
    monthId: number;
    username: string;
    isDefault: boolean;
}

export type {
    Tricount,
    TricountInteraction,
    TricountPayeeLight,
    TricountPayee,
    MeUser,
    User,
    UserLight,
    TricountCategory,
    TricountCategoryRegex,
    CountInteraction,
};
