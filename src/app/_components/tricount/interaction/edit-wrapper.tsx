"use client";

import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import {
    TricountInteractionForm,
    TricountInteractionCreationInputsSkeleton,
} from "./creation-inputs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface TricountInteractionEditWrapperProps {
    user: MeUser;
    idTri: number;
    idInteraction: number;
}

function TricountInteractionEditWrapper({
    user,
    idTri,
    idInteraction,
}: TricountInteractionEditWrapperProps) {
    const router = useRouter();
    const { data: interactions, isLoading } =
        api.tricountInteraction.getInteractionsByTricount.useQuery({
            token: user.token,
            idTri,
        });

    const interaction = interactions?.find((i) => i.id === idInteraction);

    useEffect(() => {
        if (!isLoading && !interaction) {
            router.push(`/tricount/${idTri}`);
        }
    }, [isLoading, interaction, router, idTri]);

    if (isLoading) {
        return <TricountInteractionCreationInputsSkeleton />;
    }

    if (!interaction) {
        return null;
    }

    return (
        <TricountInteractionForm
            user={user}
            idTri={idTri}
            interaction={interaction}
        />
    );
}

export { TricountInteractionEditWrapper };
