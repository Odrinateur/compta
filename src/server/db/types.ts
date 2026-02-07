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

interface Etf {
    id: number;
    username: string;
    name: string;
    identifier: string;
    yahooSymbol: string;
    yahooName: string;
    annualFeePercent: number;
    createdAt: string;
}

interface StockTransaction {
    id: number;
    etfId: number;
    username: string;
    date: string;
    side?: "buy" | "sell";
    quantity: number;
    price: number;
    operationFee: number;
    etf?: Etf;
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
    Etf,
    StockTransaction,
};
