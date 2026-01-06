"use client";

import { type User } from "@/server/db/types";
import { api } from "@/trpc/react";
import { H3 } from "../ui/typography";

interface TricountNameProps {
    user: User;
    idTri: number;
    initialName: string;
}

export default function TricountName({ user, idTri, initialName }: TricountNameProps) {
    const { data: tricount } = api.tricount.getTricountById.useQuery(
        { token: user.token, idTri },
        { initialData: { name: initialName, id: idTri } as { name: string; id: number } }
    );

    return <H3 className="text-center">{tricount?.name ?? initialName}</H3>;
}

