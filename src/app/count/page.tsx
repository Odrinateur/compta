import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { Button } from "../_components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { H3 } from "../_components/ui/typography";
import { InteractionCreationInput } from "../_components/count/month/interaction-creation-input";

export default async function CountPage() {
    const user = await getUser();
    const currentMonth = await api.month.getCurrentMonth({
        token: user?.token,
    });

    return (
        <>
            <section className="flex w-full justify-center gap-4">
                {currentMonth.previousMonthId && (
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                )}
                <H3>
                    {currentMonth.month.month} - {currentMonth.month.year}
                </H3>
                {currentMonth.nextMonthId && (
                    <Button variant="outline" size="icon">
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                )}
            </section>

            <InteractionCreationInput
                categories={currentMonth.interactions
                    .map((interaction) => interaction.category)
                    .filter(
                        (category): category is NonNullable<typeof category> =>
                            category !== null
                    )}
            />
        </>
    );
}
