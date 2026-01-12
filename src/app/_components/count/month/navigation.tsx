"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../ui/button";
import {
    ArrowLeft,
    ArrowLeftIcon,
    ArrowRight,
    SettingsIcon,
} from "lucide-react";
import { H3 } from "../../ui/typography";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../../ui/dialog";
import { useState } from "react";
import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import Link from "next/link";

interface MonthNavigationProps {
    month: number;
    year: number;
    previousMonthId: string | null;
    nextMonthId: string | null;
    user: MeUser;
}

const monthNames = [
    "Jan.",
    "Fev.",
    "Mar.",
    "Avr.",
    "Mai",
    "Juin",
    "Juil.",
    "Aout",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dec.",
];

type DirectionOfCreation = "previous" | "next";

function getAdjacentMonth(
    month: number,
    year: number,
    direction: DirectionOfCreation
): { month: number; year: number } {
    const offset = direction === "previous" ? -1 : 1;
    let newMonth = month + offset;
    let newYear = year;

    if (newMonth < 1) {
        newMonth = 12;
        newYear = year - 1;
    } else if (newMonth > 12) {
        newMonth = 1;
        newYear = year + 1;
    }

    return { month: newMonth, year: newYear };
}

export function MonthNavigation({
    month,
    year,
    previousMonthId,
    nextMonthId,
    user,
}: MonthNavigationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [open, setOpen] = useState(false);
    const [directionOfCreation, setDirectionOfCreation] =
        useState<DirectionOfCreation>("next");

    const createMonthMutation = api.countMonth.createMonth.useMutation({
        onSuccess: (data) => {
            navigateToMonth(data.id.toString());
        },
    });

    const navigateToMonth = (monthId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("monthId", monthId);
        router.push(`/count?${params.toString()}`, { scroll: false });
    };

    const handleNavigateToMonth = (
        monthId: string | null,
        direction: DirectionOfCreation
    ) => {
        if (monthId) {
            navigateToMonth(monthId);
            return;
        }

        setOpen(true);
        setDirectionOfCreation(direction);
    };

    const handleCreateMonth = () => {
        const { month: newMonth, year: newYear } = getAdjacentMonth(
            month,
            year,
            directionOfCreation
        );

        createMonthMutation.mutate({
            token: user.token,
            username: user.username,
            year: newYear,
            month: newMonth,
        });

        setOpen(false);
    };

    const targetMonth = getAdjacentMonth(month, year, directionOfCreation);

    return (
        <>
            <section className="relative flex justify-center gap-4 w-full">
                <div className="left-0 absolute flex justify-center gap-2">
                    <Link href="/">
                        <Button size="icon">
                            <ArrowLeftIcon />
                        </Button>
                    </Link>
                    <Link href={`/count/settings?monthId=${previousMonthId}`}>
                        <Button size="icon">
                            <SettingsIcon />
                        </Button>
                    </Link>
                </div>
                <Button
                    variant={previousMonthId ? "default" : "outline"}
                    size="icon"
                    onClick={() =>
                        handleNavigateToMonth(previousMonthId, "previous")
                    }
                >
                    <ArrowLeft />
                </Button>

                <H3>
                    {monthNames[month - 1]} - {year}
                </H3>

                <Button
                    variant={nextMonthId ? "default" : "outline"}
                    size="icon"
                    onClick={() => handleNavigateToMonth(nextMonthId, "next")}
                >
                    <ArrowRight />
                </Button>
            </section>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Création d&apos;un nouveau mois
                        </DialogTitle>
                        <DialogDescription>
                            Vous êtes sur le points de créer un nouveau mois (
                            {monthNames[targetMonth.month - 1]} -{" "}
                            {targetMonth.year}
                            ).
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Annuler
                        </Button>
                        <Button variant="default" onClick={handleCreateMonth}>
                            Créer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
