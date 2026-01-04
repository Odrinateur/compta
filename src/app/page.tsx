import { getUser } from "@/lib/get-user";
import { api } from "@/trpc/server";
import { H3 } from "./_components/ui/typography";
import { Button } from "./_components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { InteractionCreationInput } from "./_components/month/interaction-creation-input";

export default async function Home() {
    const user = await getUser();
    const currentMonth = await api.month.getCurrentMonth({ token: user?.token });

    return (
        <main className="flex flex-col justify-start gap-4 px-8 py-4 h-full">
            <section className="flex justify-center gap-4 w-full">
                {currentMonth.previousMonthId && (
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                )}
                <H3>{currentMonth.month.month} - {currentMonth.month.year}</H3>
                {currentMonth.nextMonthId && (
                    <Button variant="outline" size="icon">
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                )}
            </section>

            <InteractionCreationInput categories={currentMonth.interactions
                .map((interaction) => interaction.category)
                .filter((category): category is NonNullable<typeof category> => category !== null)} />
        </main>
    );
}
