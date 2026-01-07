"use client";

import { Button } from "@/app/_components/ui/button";
import { CheckIcon, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/_components/ui/dialog";

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
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="outline">
                    <CheckIcon />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirmer le remboursement</DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground text-sm">
                    Êtes-vous sûr de vouloir marquer cette dette comme
                    remboursée ? Cette action est irréversible.
                </p>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button
                            variant="outline"
                            disabled={markDebtAsRefundedMutation.isPending}
                        >
                            Annuler
                        </Button>
                    </DialogClose>
                    <Button
                        onClick={handleRefund}
                        disabled={markDebtAsRefundedMutation.isPending}
                        size={
                            markDebtAsRefundedMutation.isPending
                                ? "icon"
                                : "default"
                        }
                    >
                        {markDebtAsRefundedMutation.isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            "Confirmer"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
