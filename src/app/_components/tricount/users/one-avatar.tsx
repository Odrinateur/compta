"use client";

import { type User } from "@/server/db/types";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { ResponsiveTooltip } from "../../ui/responsive-tooltip";

interface OneAvatarProps {
    username: string;
    currentUser: User;
    description?: string;
}

export default function OneAvatar({ username, currentUser, description }: OneAvatarProps) {
    return (
        <ResponsiveTooltip
            side="top"
            className="text-sm"
            content={
                <>
                    <p>
                        {username} {username === currentUser.username && <span className="font-normal text-muted-foreground"> (moi)</span>}
                    </p>
                    {description && <p>{description}</p>}
                </>
            }
        >
            <Avatar>
                <AvatarImage src="#" alt={username} />
                <AvatarFallback>{username.charAt(0)}</AvatarFallback>
            </Avatar>
        </ResponsiveTooltip>
    );
}