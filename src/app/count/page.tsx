import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { InteractionCreationInput } from "../_components/count/month/interaction/creation-input";
import { MonthNavigation } from "../_components/count/month/navigation";
import { InteractionTable } from "../_components/count/month/interaction/card";
import { TotalAmount } from "../_components/count/month/total-amount";

interface CountPageProps {
    searchParams: Promise<{ monthId?: string }>;
}

export default async function CountPage({ searchParams }: CountPageProps) {
    const { monthId } = await searchParams;
    const user = await getUser();
    const currentMonth = await api.countMonth.getCurrentMonth({
        token: user?.token,
        monthId: monthId ? parseInt(monthId, 10) : undefined,
    });

    return (
        <>
            <MonthNavigation
                month={currentMonth.month.month}
                year={currentMonth.month.year}
                previousMonthId={
                    currentMonth.previousMonthId?.toString() ?? null
                }
                nextMonthId={currentMonth.nextMonthId?.toString() ?? null}
                user={user}
            />

            <TotalAmount user={user} monthId={currentMonth.month.id} />

            <InteractionCreationInput
                user={user}
                monthId={currentMonth.month.id}
            />

            <InteractionTable user={user} monthId={currentMonth.month.id} />
        </>
    );
}
