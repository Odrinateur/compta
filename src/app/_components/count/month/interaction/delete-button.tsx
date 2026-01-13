"use client";

import { Button } from "@/app/_components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import { type MeUser } from "@/server/db/types";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { CustomDialog } from "@/app/_components/custom-dialog";
import { api } from "@/trpc/react";

interface DeleteInteractionButtonProps {
    user: MeUser;
    monthId: number;
    interactionId: number;
    interactionName: string;
}

export function DeleteInteractionButton({
    user,
    monthId,
    interactionId,
    interactionName,
}: DeleteInteractionButtonProps) {
    const [open, setOpen] = useState(false);
    const utils = api.useUtils();

    const removeInteractionMutation =
        api.countInteraction.removeInteraction.useMutation({
            onSuccess: async () => {
                await utils.countInteraction.getMonthInteractions.invalidate({
                    token: user.token,
                    monthId: monthId,
                    username: user.username,
                });

                await utils.countMonth.getTotalAmount.invalidate({
                    token: user.token,
                    monthId: monthId,
                });

                setOpen(false);
            },
        });

    const handleDelete = () => {
        removeInteractionMutation.mutate({
            token: user.token,
            monthId: monthId,
            username: user.username,
            idInteraction: interactionId,
        });
    };

    return (
        <>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="ghost" onClick={() => setOpen(true)}>
                        <Trash2 />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Supprimer la dépense</p>
                </TooltipContent>
            </Tooltip>

            <CustomDialog
                open={open}
                setOpen={setOpen}
                title="Supprimer la dépense"
                description={`Êtes-vous sûr de vouloir supprimer la dépense "${interactionName}" ? Cette action est irréversible.`}
                variant="destructive"
                confirmText="Supprimer"
                cancelText="Annuler"
                onConfirm={handleDelete}
                confirmLoading={removeInteractionMutation.isPending}
            />
        </>
    );
}
