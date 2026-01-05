"use client";

import { type User } from "@/server/db/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { X } from "lucide-react";
import { api } from "@/trpc/react";

interface AvatarsProps {
    user: User;
    idTri: number;
}

export default function Avatars({ user, idTri }: AvatarsProps) {
    const utils = api.useUtils();

    const { data: users, isLoading } = api.tricount.getUsersInTricount.useQuery({
        token: user.token,
        idTri,
    });

    const removeUserFromTricountMutation = api.tricount.removeUserFromTricount.useMutation({
        onSuccess: async () => {
            await utils.tricount.getUsersInTricount.invalidate({ token: user.token, idTri });
            await utils.tricount.getUsersNotInTricount.invalidate({ token: user.token, idTri });
        }
    });

    const handleRemoveUserFromTricount = async (userId: string) => {
        await removeUserFromTricountMutation.mutateAsync({ token: user.token, idTri, userId });
    }

    if (isLoading || !users) {
        return null;
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