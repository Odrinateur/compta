"use client";

import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import { H4 } from "../ui/typography";
import { formatAmount } from "@/lib/utils";
import OneAvatar from "./users/one-avatar";
import { ArrowRightIcon } from "lucide-react";
import RefundDebtButton from "./refund-debt-button";
import { Skeleton } from "../ui/skeleton";

interface TricountStatsProps {
    user: MeUser;
    idTri: number;
}

export default function TricountStats({ user, idTri }: TricountStatsProps) {
    const { data: stats, isLoading } = api.tricount.getTricountStats.useQuery({
        token: user.token,
        idTri,
    });

    if (isLoading || !stats) {
        return (
            <div className="flex flex-col gap-4 w-full">
                <div className="flex justify-center items-center gap-4 w-full">
                    <Skeleton className="w-48 h-6" />
                    <Skeleton className="w-32 h-6" />
                </div>
                <div className="flex flex-wrap justify-center items-center gap-4 w-full">
                    <Skeleton className="w-64 h-16" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex justify-center items-center gap-4 w-full">
                <H4>
                    {new Date().toLocaleDateString("fr-FR", {
                        month: "long",
                        year: "numeric",
                    })}
                    : {formatAmount(stats.totalThisMonth)}
                </H4>
                <H4>Total: {formatAmount(stats.totalAmount)}</H4>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-4 w-full">
                {stats.debts.map((debt, index: number) => (
                    <div
                        key={index}
                        className="border border-muted rounded-lg flex justify-center items-center gap-2 p-3"
                    >
                        <OneAvatar user={debt.debtor} currentUser={user} />
                        <p className="font-medium">
                            {formatAmount(debt.amount)}
                        </p>
                        <ArrowRightIcon className="size-4" />
                        <OneAvatar user={debt.creditor} currentUser={user} />
                        <RefundDebtButton
                            user={user}
                            idTri={idTri}
                            debtorUsername={debt.debtor.username}
                            creditorUsername={debt.creditor.username}
                        />
                    </div>
                ))}
            </div>
        </>
    );
}
