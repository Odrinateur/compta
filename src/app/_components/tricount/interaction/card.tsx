"use client";

import { type User, type TricountInteraction } from "@/server/db/types";
import { Card } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../ui/tooltip";
import { Sparkles, Search, ArrowUpDown, X } from "lucide-react";
import { api } from "@/trpc/react";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Button } from "../../ui/button";
import { useState, useMemo } from "react";
import { Checkbox } from "../../ui/checkbox";
import { H3 } from "../../ui/typography";
import { formatAmount, formatDate } from "@/lib/utils";

interface TricountInteractionCardProps {
    interaction: TricountInteraction;
    user: User;
}

function TricountInteractionCard({ interaction, user }: TricountInteractionCardProps) {
    const isPayer = user.username === interaction.userIdPayer;

    const utils = api.useUtils();
    const setInteractionRefundedMutation = api.tricountInteraction.setInteractionRefunded.useMutation({
        onSuccess: () => {
            void utils.tricountInteraction.getInteractionsByTricount.invalidate({ token: user.token, idTri: interaction.triId });
        }
    });

    return (
        <Card className="flex sm:flex-row flex-col items-start sm:items-center gap-3 px-4 py-3" style={interaction.isRefunded ? { opacity: 0.6, pointerEvents: "none" } : undefined}>
            <div className="flex items-center gap-2">
                <Checkbox
                    checked={interaction.isRefunded}
                    onCheckedChange={(checked) => void setInteractionRefundedMutation.mutate({ token: user.token, idTri: interaction.triId, idInteraction: interaction.id, isRefunded: checked as boolean })}
                    className="size-4"
                />
                <H3 className="sm:min-w-[140px] sm:max-w-[200px] font-semibold text-base truncate shrink-0">
                    {interaction.name}
                </H3>
            </div>

            <div className="flex sm:flex-row flex-col flex-1 sm:items-center gap-1.5 sm:gap-4 min-w-0">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Avatar>
                            <AvatarImage src="#" alt={interaction.userIdPayer} />
                            <AvatarFallback>{interaction.userIdPayer.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-sm">
                        <p>
                            {interaction.userIdPayer} {isPayer && <span className="font-normal text-muted-foreground"> (moi)</span>}
                        </p>
                    </TooltipContent>
                </Tooltip>

                <p className="text-muted-foreground text-xs">
                    {formatDate(interaction.date)}
                    <span className="mx-1.5">·</span>
                    {interaction.category.name}
                </p>
            </div>

            <div className="flex justify-between sm:justify-end items-center gap-3 sm:gap-4 w-full sm:w-auto">
                {interaction.payees.length > 0 && (
                    <div className="sm:block flex flex-col gap-2">
                        <div className="flex items-center -space-x-2 shrink-0">
                            {interaction.payees.slice(0, 5).map((payee) => {
                                const isCurrentUser = user.username === payee.username;

                                return (
                                    <Tooltip key={payee.username}>
                                        <TooltipTrigger asChild>
                                            <Avatar>
                                                <AvatarImage src="#" alt={payee.username} />
                                                <AvatarFallback>{payee.username.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-sm">
                                            <p className="font-semibold">
                                                {payee.username}
                                                {isCurrentUser && <span className="font-normal text-muted-foreground"> (moi)</span>}
                                            </p>
                                            <p className="">
                                                {formatAmount(payee.amount)}
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                            {interaction.payees.length > 5 && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Avatar>
                                            <AvatarImage src="#" alt={`${interaction.payees.length - 5} autres`} />
                                            <AvatarFallback>+{interaction.payees.length - 5}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-sm">
                                        {interaction.payees.slice(5).map(p => p.username).join(', ')}
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-col items-end shrink-0">
                    <span className="font-bold tabular-nums text-lg">
                        {formatAmount(interaction.amount)}
                    </span>
                </div>
            </div>

            <div className="md:hidden flex flex-col gap-1 w-full">
                {interaction.payees.map((payee) => {
                    const isCurrentUser = user.username === payee.username;
                    return (
                        <div key={payee.username} className="flex items-center gap-1.5">
                            <span className="text-muted-foreground text-xs">
                                {payee.username}
                                {isCurrentUser && <span className="text-muted-foreground/70"> (moi)</span>}
                            </span>
                            <span className="font-medium tabular-nums text-xs">
                                {formatAmount(payee.amount)}
                            </span>
                        </div>
                    );
                })}
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
    user: User;
    idTri: number;
}

function TrictountInteractionGridCard({ user, idTri }: TrictountInteractionGridCardProps) {
    const { data: interactions, isLoading } = api.tricountInteraction.getInteractionsByTricount.useQuery({ token: user.token, idTri });
    const { data: categories } = api.tricountInteraction.getCategoriesByTricount.useQuery({ token: user.token, idTri });
    const { data: users } = api.tricount.getUsersInTricount.useQuery({ token: user.token, idTri });

    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "payer" | "category">("date-desc");
    const [filterPayer, setFilterPayer] = useState<string>("all");
    const [filterCategory, setFilterCategory] = useState<string>("all");
    const [filterRefunded, setFilterRefunded] = useState<string>("all");

    const filteredAndSortedInteractions = useMemo(() => {
        if (!interactions) return [];

        let filtered = [...interactions];

        if (searchQuery.trim()) {
            filtered = filtered.filter(interaction =>
                interaction.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (filterPayer !== "all") {
            filtered = filtered.filter(interaction => interaction.userIdPayer === filterPayer);
        }

        if (filterCategory !== "all") {
            filtered = filtered.filter(interaction => interaction.categoryId === Number(filterCategory));
        }

        if (filterRefunded !== "all") {
            filtered = filtered.filter(interaction =>
                filterRefunded === "refunded" ? interaction.isRefunded : !interaction.isRefunded
            );
        }

        filtered.sort((a, b) => {
            switch (sortBy) {
                case "date-desc":
                    return new Date(b.date).getTime() - new Date(a.date).getTime();
                case "date-asc":
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                case "payer":
                    return a.userIdPayer.localeCompare(b.userIdPayer);
                case "category":
                    return a.category.name.localeCompare(b.category.name);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [interactions, searchQuery, sortBy, filterPayer, filterCategory, filterRefunded]);

    const groupedByDate = useMemo(() => {
        return filteredAndSortedInteractions.reduce((acc, interaction) => {
            const date = new Date(interaction.date);
            const dateKey = new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(date);

            acc[dateKey] ??= [];
            acc[dateKey].push(interaction);
            return acc;
        }, {} as Record<string, TricountInteraction[]>);
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

    const hasActiveFilters = searchQuery.trim() !== "" || filterPayer !== "all" || filterCategory !== "all" || filterRefunded !== "all";

    return (
        <div className="flex flex-col gap-4 mt-4 w-full">
            <div className="flex flex-wrap gap-2 w-full">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="top-1/2 left-3 absolute pointer-events-none size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                        <ArrowUpDown className="mr-2 size-4" />
                        <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date-desc">Date (récent)</SelectItem>
                        <SelectItem value="date-asc">Date (ancien)</SelectItem>
                        <SelectItem value="payer">Payé par</SelectItem>
                        <SelectItem value="category">Catégorie</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={filterPayer} onValueChange={setFilterPayer}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                        <SelectValue placeholder="Payé par" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous (utilisateurs)</SelectItem>
                        {users?.map((user) => (
                            <SelectItem key={user} value={user}>
                                {user}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                        <SelectValue placeholder="Catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Toutes (catégories)</SelectItem>
                        {categories?.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={filterRefunded} onValueChange={setFilterRefunded}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9">
                        <SelectValue placeholder="Remboursement" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous (remboursements)</SelectItem>
                        <SelectItem value="refunded">Remboursés</SelectItem>
                        <SelectItem value="not-refunded">Non remboursés</SelectItem>
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
            <div className="flex flex-wrap gap-2 mt-4 w-full">
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

export { TricountInteractionCard, TricountInteractionCardSkeleton, TrictountInteractionGridCard, TrictountInteractionGridCardSkeleton };
