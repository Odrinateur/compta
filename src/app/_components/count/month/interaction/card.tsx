"use client";

import { type MeUser } from "@/server/db/types";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { BookmarkPlus, Pencil, Sparkles, Trash2 } from "lucide-react";
import { api } from "@/trpc/react";
import { formatAmount } from "@/lib/utils";
import { Badge } from "@/app/_components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/_components/ui/table";
import { Button } from "@/app/_components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/app/_components/ui/tooltip";

interface InteractionTableProps {
    user: MeUser;
    monthId: number;
}

function InteractionTable({ user, monthId }: InteractionTableProps) {
    const { data: interactions, isLoading } =
        api.countInteraction.getMonthInteractions.useQuery({
            token: user.token,
            monthId: monthId,
            username: user.username,
        });

    if (isLoading) {
        return <InteractionTableSkeleton />;
    }

    const defaultInteractions = interactions?.filter(
        (interaction) => interaction.isDefault
    );
    const customInteractions = interactions?.filter(
        (interaction) => !interaction.isDefault
    );

    const utils = api.useUtils();
    const updateInteractionMutation =
        api.countInteraction.updateInteraction.useMutation({
            onSuccess: async () => {
                await utils.countInteraction.getMonthInteractions.invalidate({
                    token: user.token,
                    monthId: monthId,
                    username: user.username,
                });
                await utils.countMonth.getTotalAmount.invalidate({
                    token: user.token,
                    monthId: monthId,
                });
            },
        });
    const removeInteractionMutation =
        api.countInteraction.removeInteraction.useMutation({
            onSuccess: async () => {
                await utils.countInteraction.getMonthInteractions.invalidate({
                    token: user.token,
                    monthId: monthId,
                    username: user.username,
                });
                await utils.countMonth.getTotalAmount.invalidate({
                    token: user.token,
                    monthId: monthId,
                });
            },
        });

    const renderTableHeader = () => (
        <TableHeader>
            <TableRow>
                <TableHead className="w-1/4">
                    <p>Nom</p>
                </TableHead>
                <TableHead className="w-1/4">
                    <p>Montant</p>
                </TableHead>
                <TableHead className="w-1/4">
                    <p>Catégorie</p>
                </TableHead>
                <TableHead className="w-1/4 text-center">
                    <p>Action</p>
                </TableHead>
            </TableRow>
        </TableHeader>
    );

    const renderTableRow = (
        interaction: NonNullable<typeof interactions>[number],
        isDefault: boolean
    ) => (
        <TableRow key={interaction.id} className="cursor-pointer">
            <TableCell className="font-medium">{interaction.name}</TableCell>
            <TableCell className="font-semibold tabular-nums">
                {formatAmount(interaction.amount)}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
                <Badge variant="outline">
                    {interaction.category?.name ?? "Sans catégorie"}
                </Badge>
            </TableCell>
            <TableCell className="flex justify-center">
                <Tooltip>
                    <TooltipTrigger>
                        <Button variant="ghost">
                            <Pencil />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Modifier la dépense</p>
                    </TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger>
                        <Button variant="ghost">
                            <Trash2 />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Supprimer la dépense</p>
                    </TooltipContent>
                </Tooltip>
                {!isDefault && (
                    <Tooltip>
                        <TooltipTrigger>
                            <Button variant="ghost">
                                <BookmarkPlus />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Ajouter à mes dépenses par défaut</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </TableCell>
        </TableRow>
    );

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {interactions && interactions.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {defaultInteractions && defaultInteractions.length > 0 ? (
                        <>
                            <div className="rounded-md border">
                                <Table className="table-fixed">
                                    {renderTableHeader()}
                                    <TableBody>
                                        {defaultInteractions.map(
                                            (interaction) =>
                                                renderTableRow(
                                                    interaction,
                                                    true
                                                )
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {customInteractions &&
                                customInteractions.length > 0 && (
                                    <div className="rounded-md border">
                                        <Table className="table-fixed">
                                            <TableBody>
                                                {customInteractions.map(
                                                    (interaction) =>
                                                        renderTableRow(
                                                            interaction,
                                                            false
                                                        )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                        </>
                    ) : (
                        <div className="rounded-md border">
                            <Table className="table-fixed">
                                {renderTableHeader()}
                                <TableBody>
                                    {customInteractions?.map((interaction) =>
                                        renderTableRow(interaction, false)
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="text-muted-foreground/30 mb-4 h-10 w-10" />
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

function InteractionTableSkeleton() {
    return (
        <div className="flex w-full flex-col gap-4">
            <div className="flex w-full flex-wrap gap-2">
                <Skeleton className="h-9 min-w-[200px] flex-1" />
                <Skeleton className="h-9 w-[180px]" />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Date</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead className="hidden sm:table-cell">
                                Catégorie
                            </TableHead>
                            <TableHead className="text-right">
                                Montant
                            </TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <TableRow key={index}>
                                <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-32" />
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <Skeleton className="h-5 w-20" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="ml-auto h-4 w-16" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export { InteractionTable, InteractionTableSkeleton };
