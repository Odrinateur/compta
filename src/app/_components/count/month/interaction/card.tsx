"use client";

import { type CountInteraction, type MeUser } from "@/server/db/types";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { BookmarkPlus, Sparkles } from "lucide-react";
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
import { EditInteractionButton } from "./edit-button";
import { DeleteInteractionButton } from "./delete-button";

interface InteractionTableProps {
    user: MeUser;
    monthId: number;
}

function InteractionTable({ user, monthId }: InteractionTableProps) {
    const { data: interactions, isLoading: isLoadingInteractions } =
        api.countInteraction.getMonthInteractions.useQuery({
            token: user.token,
            monthId: monthId,
            username: user.username,
            default: false,
        });

    const {
        data: defaultInteractions,
        isLoading: isLoadingDefaultInteractions,
    } = api.countInteraction.getMonthInteractions.useQuery({
        token: user.token,
        monthId: monthId,
        username: user.username,
        default: true,
    });

    const utils = api.useUtils();
    const addToDefaultInteractionsMutation =
        api.countInteraction.createInteraction.useMutation({
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

    const isLoading = isLoadingInteractions || isLoadingDefaultInteractions;
    if (isLoading) {
        return <InteractionTableSkeleton />;
    }

    const handleAddToDefaultInteractions = (interaction: CountInteraction) => {
        addToDefaultInteractionsMutation.mutate({
            token: user.token,
            monthId: monthId,
            username: user.username,
            name: interaction.name,
            categoryId: interaction.categoryId,
            amount: interaction.amount / 100,
            isDefault: true,
            oldInteractionId: interaction.id,
        });
    };

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
        interaction: CountInteraction,
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
                <EditInteractionButton
                    user={user}
                    monthId={monthId}
                    interactionId={interaction.id}
                />
                <DeleteInteractionButton
                    user={user}
                    monthId={monthId}
                    interactionId={interaction.id}
                    interactionName={interaction.name}
                />
                {!isDefault && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                onClick={() =>
                                    handleAddToDefaultInteractions(interaction)
                                }
                            >
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

    const hasInteractions = Boolean(interactions && interactions.length > 0);
    const hasDefaultInteractions = Boolean(
        defaultInteractions && defaultInteractions.length > 0
    );
    const hasAnyInteractions = hasInteractions || hasDefaultInteractions;

    return (
        <div className="flex flex-col gap-4 mx-auto w-full max-w-3xl">
            {hasAnyInteractions ? (
                <div className="flex flex-col gap-4">
                    {hasDefaultInteractions ? (
                        <>
                            {defaultInteractions && (
                                <div className="border rounded-md">
                                    <Table className="table-fixed">
                                        {renderTableHeader()}
                                        <TableBody>
                                            {defaultInteractions.map(
                                                (interaction) =>
                                                    renderTableRow(
                                                        interaction as CountInteraction,
                                                        true
                                                    )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                            {hasInteractions && interactions ? (
                                <div className="border rounded-md">
                                    <Table className="table-fixed">
                                        <TableBody>
                                            {interactions.map((interaction) =>
                                                renderTableRow(
                                                    interaction as CountInteraction,
                                                    false
                                                )
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="border rounded-md">
                                    <Table className="table-fixed">
                                        <TableHeader className="[&_tr]:border-b-0">
                                            <TableRow>
                                                <TableHead className="w-full text-center">
                                                    <p>
                                                        Aucune dépenses autres
                                                        que celles par défaut
                                                    </p>
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                    </Table>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div className="border rounded-md">
                                <Table className="table-fixed">
                                    <TableHeader className="[&_tr]:border-b-0">
                                        <TableRow>
                                            <TableHead className="w-full text-center">
                                                <p>
                                                    Aucune dépenses par défaut
                                                </p>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                            </div>
                            <div className="border rounded-md">
                                <Table className="table-fixed">
                                    {renderTableHeader()}
                                    <TableBody>
                                        {interactions?.map((interaction) =>
                                            renderTableRow(
                                                interaction as CountInteraction,
                                                false
                                            )
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
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

function InteractionTableSkeleton() {
    return (
        <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-wrap gap-2 w-full">
                <Skeleton className="flex-1 min-w-[200px] h-9" />
                <Skeleton className="w-[180px] h-9" />
            </div>
            <div className="border rounded-md">
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
                                    <Skeleton className="w-16 h-4" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="w-32 h-4" />
                                </TableCell>
                                <TableCell className="hidden sm:table-cell">
                                    <Skeleton className="w-20 h-5" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="ml-auto w-16 h-4" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="w-16 h-4" />
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
