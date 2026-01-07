"use client";

import {
    type TricountPayee,
    type MeUser,
    type User,
    type TricountPayeeLight,
} from "@/server/db/types";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { ResponsiveTooltip } from "../../ui/responsive-tooltip";
import { formatAmount } from "@/lib/utils";
import { api } from "@/trpc/react";

interface OneAvatarProps {
    user: User | TricountPayee | TricountPayeeLight | { username: string };
    currentUser: MeUser;
}

export default function OneAvatar({ user, currentUser }: OneAvatarProps) {
    const { data: avatarUrl } = api.user.getAvatar.useQuery(
        { username: user.username },
        { staleTime: Infinity }
    );

    return (
        <ResponsiveTooltip
            side="top"
            className="text-sm"
            content={
                <>
                    <p>
                        {user.username}{" "}
                        {user.username === currentUser.username && (
                            <span className="font-normal text-muted-foreground">
                                {" "}
                                (moi)
                            </span>
                        )}
                    </p>
                    {"amount" in user && <p>{formatAmount(user.amount)}</p>}
                </>
            }
        >
            <Avatar>
                <AvatarImage src={avatarUrl ?? undefined} alt={user.username} />
                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
        </ResponsiveTooltip>
    );
}
