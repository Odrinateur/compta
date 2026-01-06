"use client";

import { type TricountPayeeLight, type MeUser } from "@/server/db/types";
import { ResponsiveTooltip } from "../../ui/responsive-tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { X } from "lucide-react";
import { api } from "@/trpc/react";
import OneAvatar from "./one-avatar";

interface AvatarsProps {
    user: MeUser;
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

    const handleRemoveUserFromTricount = async (username: string) => {
        await removeUserFromTricountMutation.mutateAsync({ token: user.token, idTri, username });
    }

    if (isLoading || !users) {
        return null;
    }

    return (
        <div className="*:data-[slot=avatar]:grayscale *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background flex -space-x-2">
            {users.map((inTricountUser) => (
                <AvatarWithRemove
                    key={inTricountUser.username}
                    inTricountUser={inTricountUser}
                    currentUser={user}
                    onRemove={handleRemoveUserFromTricount}
                />
            ))}
        </div>
    );
}

interface AvatarWithRemoveProps {
    inTricountUser: {
        username: string;
    };
    currentUser: MeUser;
    onRemove: (username: string) => void;
}

function AvatarWithRemove({
    inTricountUser,
    currentUser,
    onRemove,
}: AvatarWithRemoveProps) {
    const { data: avatarUrl } = api.user.getAvatar.useQuery(
        { username: inTricountUser.username },
        { staleTime: Infinity },
    );

    return (
        <ResponsiveTooltip
            className="flex items-center gap-2"
            content={
                <>
                    {inTricountUser.username}
                    {inTricountUser.username !== currentUser.username && (
                        <X
                            className="hover:cursor-pointer size-4"
                            onClick={() => {
                                onRemove(inTricountUser.username);
                            }}
                        />
                    )}
                </>
            }
        >
            <Avatar>
                <AvatarImage
                    src={avatarUrl ?? undefined}
                    alt={inTricountUser.username}
                />
                <AvatarFallback>{inTricountUser.username.charAt(0)}</AvatarFallback>
            </Avatar>
        </ResponsiveTooltip>
    );
}

interface AvatarsWithInteractionProps {
    payees: TricountPayeeLight[];
    currentUser: MeUser;
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
                        <OneAvatar key={payee.username} user={payee} currentUser={currentUser} />
                    );
                })}
            </div>
        </div>
    )
}

export { Avatars, AvatarsWithInteraction };