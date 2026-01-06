"use client";

import { type TricountPayee, type User } from "@/server/db/types";
import { ResponsiveTooltip } from "../../ui/responsive-tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { X } from "lucide-react";
import { api } from "@/trpc/react";
import { formatAmount } from "@/lib/utils";
import OneAvatar from "./one-avatar";

interface AvatarsProps {
    user: User;
    idTri: number;
}

function Avatars({ user, idTri }: AvatarsProps) {
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
                <ResponsiveTooltip
                    key={inTricountUser}
                    className="flex items-center gap-2"
                    content={
                        <>
                            {inTricountUser}
                            {inTricountUser !== user.username && (
                                <X className="hover:cursor-pointer size-4" onClick={() => {
                                    void handleRemoveUserFromTricount(inTricountUser);
                                }} />
                            )}
                        </>
                    }
                >
                    <Avatar>
                        <AvatarImage src="#" alt={inTricountUser} />
                        <AvatarFallback>{inTricountUser.charAt(0)}</AvatarFallback>
                    </Avatar>
                </ResponsiveTooltip>
            ))}
        </div>
    )
}

interface AvatarsWithInteractionProps {
    payees: TricountPayee[];
    currentUser: User;
}

function AvatarsWithInteraction({ payees, currentUser }: AvatarsWithInteractionProps) {
    if (payees.length === 0) {
        return <></>;
    }

    return (
        <div className="sm:block flex flex-col gap-2">
            <div className="flex items-center -space-x-2 shrink-0">
                {payees.map((payee) => {
                    return (
                        <OneAvatar key={payee.username} username={payee.username} currentUser={currentUser} description={formatAmount(payee.amount)} />
                    );
                })}
            </div>
        </div>
    )
}

export { Avatars, AvatarsWithInteraction };