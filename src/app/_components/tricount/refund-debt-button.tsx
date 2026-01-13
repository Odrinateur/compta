"use client";

import { Button } from "@/app/_components/ui/button";
import { CheckIcon } from "lucide-react";
import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CustomDialog } from "@/app/_components/custom-dialog";

interface RefundDebtButtonProps {
    user: MeUser;
    idTri: number;
    debtorUsername: string;
    creditorUsername: string;
}

export default function RefundDebtButton({
    user,
    idTri,
    debtorUsername,
    creditorUsername,
}: RefundDebtButtonProps) {
    const router = useRouter();
    const utils = api.useUtils();
    const [open, setOpen] = useState(false);

    const markDebtAsRefundedMutation =
        api.tricount.markDebtAsRefunded.useMutation({
            onSuccess: async () => {
                // Invalider les stats pour recalculer les dettes
                await utils.tricount.getTricountStats.invalidate({
                    token: user.token,
                    idTri,
                });
                // Invalider aussi les interactions pour mettre à jour isRefunded
                await utils.tricountInteraction.getInteractionsByTricount.invalidate(
                    {
                        token: user.token,
                        idTri,
                    }
                );
                router.refresh();
                setOpen(false);
            },
        });

    const handleRefund = async () => {
        await markDebtAsRefundedMutation.mutateAsync({
            token: user.token,
            idTri,
            debtorUsername,
            creditorUsername,
        });
    };

    return (
        <CustomDialog
            open={open}
            setOpen={setOpen}
            title="Confirmer le remboursement"
            description="Êtes-vous sûr de vouloir marquer cette dette comme remboursée ? Cette action est irréversible."
            trigger={
                <Button size="icon" variant="outline">
                    <CheckIcon />
                </Button>
            }
            confirmText="Confirmer"
            onConfirm={handleRefund}
            confirmLoading={markDebtAsRefundedMutation.isPending}
        />
    );
}
