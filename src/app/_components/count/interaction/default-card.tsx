"use client";

import { type MeUser } from "@/server/db/types";
import { EditInteractionButton } from "@/app/_components/count/interaction/edit-button";
import { DeleteInteractionButton } from "@/app/_components/count/interaction/delete-button";
import { Badge } from "@/app/_components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/_components/ui/table";
import { api } from "@/trpc/react";
import { formatAmount } from "@/lib/utils";
import { Skeleton } from "../../ui/skeleton";
import { Sparkles } from "lucide-react";

interface DefaultInteractionTableProps {
    user: MeUser;
}

function DefaultInteractionTable({ user }: DefaultInteractionTableProps) {
    const { data: defaultInteractions, isLoading } =
        api.countInteraction.getDefaultInteractions.useQuery({
            token: user.token,
        });

    if (isLoading) {
        return <DefaultInteractionTableSkeleton />;
    }
    if (!defaultInteractions || defaultInteractions.length === 0) {
        return (
            <div className="flex flex-col justify-center items-center py-12 w-full text-center">
                <Sparkles className="mb-4 w-10 h-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-lg">
                    Aucune dépense par défaut
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 mx-auto w-full max-w-4xl">
            <div className="flex flex-col gap-4">
                <div className="overflow-x-auto">
                    <div className="border rounded-md min-w-[600px]">
                        <Table className="table-fixed">
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
                            <TableBody>
                                {defaultInteractions.map((interaction) => (
                                    <TableRow key={interaction.id}>
                                        <TableCell className="font-medium text-lg">
                                            {interaction.name}
                                        </TableCell>
                                        <TableCell className="font-semibold tabular-nums text-lg">
                                            {formatAmount(interaction.amount)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="text-base"
                                            >
                                                {interaction.category?.name ??
                                                    "Sans catégorie"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="flex justify-center">
                                            <EditInteractionButton
                                                interactionId={interaction.id}
                                            />
                                            <DeleteInteractionButton
                                                user={user}
                                                monthId={0}
                                                interactionId={interaction.id}
                                                interactionName={
                                                    interaction.name
                                                }
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DefaultInteractionTableSkeleton() {
    return (
        <div className="flex flex-col gap-4 mx-auto w-full max-w-4xl">
            <div className="flex flex-col gap-4">
                <div className="overflow-x-auto">
                    <div className="border rounded-md min-w-[600px]">
                        <Table className="table-fixed">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-full">
                                        <Skeleton className="w-full h-6" />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Skeleton className="w-full h-6" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export { DefaultInteractionTable, DefaultInteractionTableSkeleton };
