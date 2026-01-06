"use client";

import { type TricountPayee, type MeUser, type User } from "@/server/db/types";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { ResponsiveTooltip } from "../../ui/responsive-tooltip";
import { formatAmount } from "@/lib/utils";

interface OneAvatarProps {
    user: User | TricountPayee;
    currentUser: MeUser;
}

export default function OneAvatar({ user, currentUser }: OneAvatarProps) {
    return (
        <ResponsiveTooltip
            side="top"
            className="text-sm"
            content={
                <>
                    <p>
                        {user.username} {user.username === currentUser.username && <span className="font-normal text-muted-foreground"> (moi)</span>}
                    </p>
                    {("amount" in user) && <p>{formatAmount(user.amount)}</p>}
                </>
            }
        >
            <Avatar>
                <AvatarImage src={user.picture ? `data:image/${user.type};base64,${user.picture}` : undefined} alt={user.username} />
                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
            </Avatar>
        </ResponsiveTooltip>
    );
}