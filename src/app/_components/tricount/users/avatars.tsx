"use client";

import { type User } from "@/server/db/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { X } from "lucide-react";
import { api } from "@/trpc/react";

interface AvatarsProps {
    users: string[];
    user: User;
    idTri: number;
}

export default function Avatars({ users, user, idTri }: AvatarsProps) {
    const removeUserFromTricountMutation = api.tricount.removeUserFromTricount.useMutation();

    const handleRemoveUserFromTricount = async (userId: string) => {
        await removeUserFromTricountMutation.mutateAsync({ token: user.token, idTri, userId });
    }

    return (
        <div className="*:data-[slot=avatar]:grayscale *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background flex -space-x-2">
            {users.map((inTricountUser: string) => (
                <Tooltip key={inTricountUser}>
                    <TooltipTrigger asChild>
                        <Avatar>
                            <AvatarImage src="#" alt={inTricountUser} />
                            <AvatarFallback>{inTricountUser.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent className="flex items-center gap-2">
                        {inTricountUser}
                        {inTricountUser !== user.username && (
                            <X className="hover:cursor-pointer size-4" onClick={() => {
                                void handleRemoveUserFromTricount(inTricountUser);
                            }} />
                        )}
                    </TooltipContent>
                </Tooltip>
            ))}
        </div>
    )
}