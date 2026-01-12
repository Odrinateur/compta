"use client";

import { type MeUser } from "@/server/db/types";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { Sparkles } from "lucide-react";
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

    return (
        <div className="flex flex-col gap-4 w-full">
            {interactions && interactions.length > 0 ? (
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <p>Nom</p>
                                </TableHead>
                                <TableHead>
                                    <p>Montant</p>
                                </TableHead>
                                <TableHead className="hidden sm:table-cell">
                                    <p>Catégorie</p>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {interactions.map((interaction) => (
                                <TableRow
                                    key={interaction.id}
                                    className="cursor-pointer"
                                >
                                    <TableCell className="font-medium">
                                        {interaction.name}
                                    </TableCell>
                                    <TableCell className="font-semibold tabular-nums">
                                        {formatAmount(interaction.amount)}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <Badge variant="outline">
                                            {interaction.category?.name ??
                                                "Sans catégorie"}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// Keep old exports for backwards compatibility
const InteractionCard = () => null;
const InteractionCardSkeleton = () => null;
const InteractionCardGrid = InteractionTable;
const InteractionCardGridSkeleton = InteractionTableSkeleton;

export {
    InteractionCard,
    InteractionCardSkeleton,
    InteractionCardGrid,
    InteractionCardGridSkeleton,
    InteractionTable,
    InteractionTableSkeleton,
};
