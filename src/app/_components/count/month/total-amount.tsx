"use client";

import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import { H2 } from "../../ui/typography";
import { formatAmount } from "@/lib/utils";
import { Skeleton } from "../../ui/skeleton";

interface TotalAmountProps {
    user: MeUser;
    monthId: number;
}

export function TotalAmount({ user, monthId }: TotalAmountProps) {
    const { data: totalAmount, isLoading } =
        api.countMonth.getTotalAmount.useQuery({
            token: user.token,
            monthId: monthId,
        });

    if (isLoading || totalAmount === undefined || totalAmount === null) {
        return (
            <H2 className="w-full text-center">
                <Skeleton className="mx-auto h-8 w-32" />
            </H2>
        );
    }

    return <H2 className="w-full text-center">{formatAmount(totalAmount)}</H2>;
}
