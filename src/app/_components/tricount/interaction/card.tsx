"use client";

import { type MeUser, type TricountInteraction } from "@/server/db/types";
import { Card } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import { Sparkles, Search, ArrowUpDown, X } from "lucide-react";
import { api } from "@/trpc/react";
import { Input } from "../../ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";
import { useState, useMemo } from "react";
import { Checkbox } from "../../ui/checkbox";
import { H3 } from "../../ui/typography";
import { formatAmount } from "@/lib/utils";
import OneAvatar from "../users/one-avatar";
import { AvatarsWithInteraction } from "../users/avatars";
import { Badge } from "../../ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "../../ui/accordion";
import { useRouter } from "next/navigation";

interface TricountInteractionCardProps {
    interaction: TricountInteraction;
    user: MeUser;
}

function TricountInteractionCard({
    interaction,
    user,
}: TricountInteractionCardProps) {
    const router = useRouter();
    const utils = api.useUtils();
    const setInteractionRefundedMutation =
        api.tricountInteraction.setInteractionRefunded.useMutation({
            onMutate: async (variables) => {
                utils.tricountInteraction.getInteractionsByTricount.setData(
                    { token: user.token, idTri: interaction.triId },
                    (old) =>
                        old?.map((inter) =>
                            inter.id === variables.idInteraction
                                ? { ...inter, isRefunded: variables.isRefunded }
                                : inter
                        )
                );
            },
            onSuccess: async () => {
                await utils.tricount.getTricountStats.refetch({
                    token: user.token,
                    idTri: interaction.triId,
                });
            },
            onSettled: () => {
                void utils.tricountInteraction.getInteractionsByTricount.invalidate(
                    { token: user.token, idTri: interaction.triId }
                );
            },
        });

    const handleCardClick = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[role="checkbox"]')) {
            return;
        }
        router.push(
            `/tricount/${interaction.triId}/interaction/${interaction.id}/edit`
        );
    };

    return (
        <Card
            className="hover:bg-muted/50 flex sm:flex-row flex-col justify-between items-start sm:items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
            style={interaction.isRefunded ? { opacity: 0.6 } : undefined}
            onClick={handleCardClick}
        >
            <div className="flex flex-wrap justify-between items-center gap-2 w-full">
                <div className="flex justify-between items-center gap-2">
                    <Checkbox
                        checked={interaction.isRefunded}
                        onCheckedChange={(checked) =>
                            void setInteractionRefundedMutation.mutate({
                                token: user.token,
                                idTri: interaction.triId,
                                idInteraction: interaction.id,
                                isRefunded: checked as boolean,
                            })
                        }
                        className="size-4"
                    />
                    <H3 className="sm:min-w-[140px] sm:max-w-[200px] font-semibold text-base truncate shrink-0">
                        {interaction.name}
                    </H3>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
                    <OneAvatar
                        user={{ username: interaction.usernamePayer }}
                        currentUser={user}
                    />
                    <Badge variant="outline">{interaction.category.name}</Badge>
                </div>
            </div>

            <div className="flex justify-between sm:justify-end items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <AvatarsWithInteraction
                    payees={interaction.usersPayees}
                    currentUser={user}
                />

                <div className="flex flex-col items-end shrink-0">
                    <span className="font-bold tabular-nums text-lg">
                        {formatAmount(interaction.amount)}
                    </span>
                </div>
            </div>
        </Card>
    );
}

function TricountInteractionCardSkeleton() {
    return (
        <Card className="flex sm:flex-row flex-col items-start sm:items-center gap-3 px-4 py-3">
            <Skeleton className="w-2/3 sm:w-32 h-5 shrink-0" />
            <div className="flex sm:flex-row flex-col flex-1 sm:items-center gap-2 sm:gap-4">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-24 h-3" />
            </div>
            <div className="flex justify-between sm:justify-end items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="flex -space-x-2">
                    <Skeleton className="rounded-full w-8 h-8" />
                    <Skeleton className="rounded-full w-8 h-8" />
                </div>
                <Skeleton className="w-16 h-6" />
            </div>
        </Card>
    );
}

interface TrictountInteractionGridCardProps {
    user: MeUser;
    idTri: number;
}

function TrictountInteractionGridCard({
    user,
    idTri,
}: TrictountInteractionGridCardProps) {
    const { data: interactions, isLoading } =
        api.tricountInteraction.getInteractionsByTricount.useQuery({
            token: user.token,
            idTri,
        });
    const { data: categories } =
        api.tricountCategory.getCategoriesByTricount.useQuery({
            token: user.token,
            idTri,
        });
    const { data: users } = api.tricount.getUsersInTricount.useQuery({
        token: user.token,
        idTri,
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<
        "date-desc" | "date-asc" | "payer" | "category"
    >("date-desc");
    const [filterPayer, setFilterPayer] = useState<string>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterRefunded, setFilterRefunded] = useState<string>("all");

    const filteredAndSortedInteractions = useMemo(() => {
        if (!interactions) return [];

        let filtered = [...interactions];

        if (searchQuery.trim()) {
            filtered = filtered.filter((interaction) =>
                interaction.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase())
            );
        }

        if (filterPayer !== "all") {
            filtered = filtered.filter(
                (interaction) => interaction.usernamePayer === filterPayer
            );
        }

        if (filterCategory !== "all") {
            filtered = filtered.filter(
                (interaction) =>
                    interaction.categoryId === Number(filterCategory)
            );
        }

        if (filterRefunded !== "all") {
            filtered = filtered.filter((interaction) =>
                filterRefunded === "refunded"
                    ? interaction.isRefunded
                    : !interaction.isRefunded
            );
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case "date-desc":
                    return (
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                case "date-asc":
                    return (
                        new Date(a.date).getTime() - new Date(b.date).getTime()
                    );
                case "payer":
                    return a.usernamePayer.localeCompare(b.usernamePayer);
                case "category":
                    return a.category.name.localeCompare(b.category.name);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [
        interactions,
        searchQuery,
        sortBy,
        filterPayer,
        filterCategory,
        filterRefunded,
    ]);

    const groupedByDate = useMemo(() => {
        return filteredAndSortedInteractions.reduce(
            (acc, interaction) => {
                const date = new Date(interaction.date);
                const dateKey = new Intl.DateTimeFormat("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                }).format(date);

                acc[dateKey] ??= [];
                acc[dateKey].push(interaction);
                return acc;
            },
            {} as Record<string, TricountInteraction[]>
        );
    }, [filteredAndSortedInteractions]);

    const sortedDates = useMemo(() => {
        return Object.keys(groupedByDate).sort((a, b) => {
            const dateA = new Date(groupedByDate[a]![0]!.date);
            const dateB = new Date(groupedByDate[b]![0]!.date);

            // Si on trie par date, on respecte l'ordre du tri
            if (sortBy === "date-desc") {
                return dateB.getTime() - dateA.getTime();
            } else if (sortBy === "date-asc") {
                return dateA.getTime() - dateB.getTime();
            }
            // Sinon, on garde l'ordre décroissant par défaut

            return dateB.getTime() - dateA.getTime();
        });
    }, [groupedByDate, sortBy]);

    if (isLoading) {
        return <TrictountInteractionGridCardSkeleton />;
    }

    const hasActiveFilters =
        searchQuery.trim() !== "" ||
        filterPayer !== "all" ||
        filterCategory !== "all" ||
        filterRefunded !== "all";

    return (
        <div className="flex flex-col gap-4 w-full">
            <Accordion type="single" collapsible>
                <AccordionItem value="filters">
                    <AccordionTrigger>Filtres</AccordionTrigger>
                    <AccordionContent>
                        <div className="flex flex-wrap gap-2 w-full">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="top-1/2 left-3 absolute pointer-events-none size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="bg-background shadow-xs border-input pr-9 pl-9 h-9"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="top-1/2 right-2 absolute transition-colors -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>

                            <Select
                                value={sortBy}
                                onValueChange={(value) =>
                                    setSortBy(value as typeof sortBy)
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[180px] h-9">
                                    <div className="flex items-center gap-2 w-full">
                                        <ArrowUpDown className="mr-2 size-4" />
                                        <SelectValue
                                            className="flex-1"
                                            placeholder="Trier par"
                                        />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="date-desc">
                                        Date (récent)
                                    </SelectItem>
                                    <SelectItem value="date-asc">
                                        Date (ancien)
                                    </SelectItem>
                                    <SelectItem value="payer">
                                        Payé par
                                    </SelectItem>
                                    <SelectItem value="category">
                                        Catégorie
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filterPayer}
                                onValueChange={setFilterPayer}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] h-9">
                                    <SelectValue placeholder="Payé par" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tous (utilisateurs)
                                    </SelectItem>
                                    {users?.map((user) => (
                                        <SelectItem
                                            key={user.username}
                                            value={user.username}
                                        >
                                            {user.username}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filterCategory}
                                onValueChange={setFilterCategory}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] h-9">
                                    <SelectValue placeholder="Catégorie" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Toutes (catégories)
                                    </SelectItem>
                                    {categories?.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filterRefunded}
                                onValueChange={setFilterRefunded}
                            >
                                <SelectTrigger className="w-full sm:w-[180px] h-9">
                                    <SelectValue placeholder="Remboursement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Tous (remboursements)
                                    </SelectItem>
                                    <SelectItem value="refunded">
                                        Remboursés
                                    </SelectItem>
                                    <SelectItem value="not-refunded">
                                        Non remboursés
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-9"
                                onClick={() => {
                                    setSearchQuery("");
                                    setFilterPayer("all");
                                    setFilterCategory("all");
                                    setFilterRefunded("all");
                                }}
                                disabled={!hasActiveFilters}
                            >
                                <X className="mr-2 size-4" />
                                Réinitialiser
                            </Button>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {sortedDates.length > 0 ? (
                <div className="flex flex-col gap-6 mx-auto w-full max-w-[700px]">
                    {sortedDates.map((dateKey) => (
                        <div key={dateKey} className="flex flex-col gap-2">
                            <h2 className="px-1 font-medium text-muted-foreground text-sm">
                                {dateKey}
                            </h2>
                            <div className="flex flex-col gap-2">
                                {groupedByDate[dateKey]?.map((interaction) => (
                                    <TricountInteractionCard
                                        user={user}
                                        interaction={interaction}
                                        key={interaction.id}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col justify-center items-center py-12 text-center">
                    <Sparkles className="mb-4 w-10 h-10 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">
                        {interactions?.length === 0
                            ? "Aucune dépense pour le moment"
                            : "Aucune dépense ne correspond aux filtres"}
                    </p>
                </div>
            )}
        </div>
    );
}

function TrictountInteractionGridCardSkeleton() {
    return (
        <>
            <div className="flex flex-wrap gap-2 w-full">
                <Skeleton className="w-full h-9" />
            </div>
            <div className="flex flex-col gap-6 mx-auto w-full max-w-[700px]">
                <div className="flex flex-col gap-2">
                    <Skeleton className="w-32 h-4" />
                    <div className="flex flex-col gap-2">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <TricountInteractionCardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
}

export {
    TricountInteractionCard,
    TricountInteractionCardSkeleton,
    TrictountInteractionGridCard,
    TrictountInteractionGridCardSkeleton,
};
