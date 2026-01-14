"use client";

import { type CountInteraction, type MeUser } from "@/server/db/types";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { BookmarkPlus, Sparkles } from "lucide-react";
import { api } from "@/trpc/react";
import { cn, formatAmount } from "@/lib/utils";
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
                    <p className="text-lg">Nom</p>
                </TableHead>
                <TableHead className="w-1/4">
                    <p className="text-lg">Montant</p>
                </TableHead>
                <TableHead className="w-1/4">
                    <p className="text-lg">Catégorie</p>
                </TableHead>
                <TableHead className="w-1/4 text-center">
                    <p className="text-lg">Action</p>
                </TableHead>
            </TableRow>
        </TableHeader>
    );

    const renderTableRow = (
        interaction: CountInteraction,
        isDefault: boolean
    ) => (
        <TableRow key={interaction.id} className={isDefault ? "bg-muted" : ""}>
            <TableCell className="font-medium text-lg">
                {interaction.name}
            </TableCell>
            <TableCell className="font-semibold tabular-nums text-lg">
                {formatAmount(interaction.amount)}
            </TableCell>
            <TableCell>
                <Badge variant="outline" className="text-base">
                    {interaction.category?.name ?? "Sans catégorie"}
                </Badge>
            </TableCell>
            <TableCell className="flex justify-center">
                <EditInteractionButton interactionId={interaction.id} />
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
                            <p className="text-base">
                                Ajouter à mes dépenses par défaut
                            </p>
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
        <div className="flex flex-col gap-4 mx-auto w-full max-w-4xl">
            {hasAnyInteractions ? (
                <div className="flex flex-col gap-4">
                    {hasDefaultInteractions ? (
                        <>
                            {defaultInteractions && (
                                <div className="overflow-x-auto">
                                    <div className="border rounded-md min-w-[600px]">
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
                                </div>
                            )}
                            {hasInteractions && interactions ? (
                                <div className="overflow-x-auto">
                                    <div className="border rounded-md min-w-[600px]">
                                        <Table className="table-fixed">
                                            <TableBody>
                                                {interactions.map(
                                                    (interaction) =>
                                                        renderTableRow(
                                                            interaction as CountInteraction,
                                                            false
                                                        )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ) : (
                                <div className="border rounded-md">
                                    <Table className="table-fixed">
                                        <TableHeader className="[&_tr]:border-b-0">
                                            <TableRow>
                                                <TableHead className="w-full text-center">
                                                    <p className="text-lg">
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
                            <div className="border rounded-md min-w-[600px]">
                                <Table className="table-fixed">
                                    <TableHeader className="[&_tr]:border-b-0">
                                        <TableRow>
                                            <TableHead className="w-full text-center">
                                                <p className="text-lg">
                                                    Aucune dépenses par défaut
                                                </p>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                            </div>

                            <div className="overflow-x-auto">
                                <div className="border rounded-md min-w-[600px]">
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
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="flex flex-col justify-center items-center py-12 text-center">
                    <Sparkles className="mb-4 w-10 h-10 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-lg">
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
        <div className="flex flex-col gap-4 mx-auto w-full max-w-4xl">
            <div className="flex flex-wrap gap-2 w-full">
                <Skeleton className="flex-1 min-w-[200px] h-9" />
                <Skeleton className="w-[180px] h-9" />
            </div>
            <div className="overflow-x-auto">
                <div className="border rounded-md min-w-[600px]">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px] text-lg">
                                    Date
                                </TableHead>
                                <TableHead className="text-lg">Nom</TableHead>
                                <TableHead className="hidden sm:table-cell text-lg">
                                    Catégorie
                                </TableHead>
                                <TableHead className="text-lg text-right">
                                    Montant
                                </TableHead>
                                <TableHead className="text-lg">
                                    Action
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Skeleton className="w-16 h-6" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="w-32 h-6" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="w-20 h-6" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Skeleton className="ml-auto w-16 h-6" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="w-16 h-6" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

export { InteractionTable, InteractionTableSkeleton };
