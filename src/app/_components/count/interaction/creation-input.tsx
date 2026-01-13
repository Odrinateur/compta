"use client";

import { Plus } from "lucide-react";
import { Input } from "@/app/_components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/_components/ui/select";
import { Button } from "@/app/_components/ui/button";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import { useState } from "react";

interface InteractionCreationInputProps {
    user: MeUser;
    monthId: number;
}

function InteractionCreationInput({
    user,
    monthId,
}: InteractionCreationInputProps) {
    const { data: categories } = api.countInteraction.getCategories.useQuery({
        token: user.token,
    });

    const utils = api.useUtils();

    const createInteractionMutation =
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

                setName("");
                setAmount(0);
                setCategoryId(undefined);
            },
        });

    const [name, setName] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [categoryId, setCategoryId] = useState<number | undefined>(undefined);

    const isPending =
        createInteractionMutation.isPending || !name || !amount || !categoryId;

    const handleCreateInteraction = () => {
        if (isPending) return;

        createInteractionMutation.mutate({
            token: user.token,
            monthId: monthId,
            username: user.username,
            name: name,
            categoryId: categoryId,
            amount: amount,
        });
    };

    return (
        <>
            <section className="flex flex-wrap justify-center gap-4 w-full">
                <Input
                    type="text"
                    placeholder="Nom"
                    className="w-64"
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <Input
                    id="amount"
                    type="number"
                    inputMode="decimal"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    value={amount || ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-64"
                    required
                />
                <Select
                    value={
                        categoryId !== undefined ? categoryId.toString() : ""
                    }
                    onValueChange={(value) => {
                        const numValue = Number(value);
                        if (!isNaN(numValue)) {
                            setCategoryId(numValue);
                        }
                    }}
                >
                    <SelectTrigger className="w-51 sm:w-64">
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                    </SelectTrigger>
                    <SelectContent>
                        {categories?.map((category) => (
                            <SelectItem
                                key={category.id}
                                value={category.id.toString()}
                            >
                                {category.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    size="icon"
                    onClick={handleCreateInteraction}
                    disabled={isPending}
                >
                    <Plus />
                </Button>
            </section>
        </>
    );
}

function InteractionCreationInputSkeleton() {
    return (
        <>
            <section className="flex justify-center gap-4 w-full">
                <Skeleton className="w-64 h-10" />
                <Skeleton className="w-64 h-10" />
                <Skeleton className="w-64 h-10" />
                <Skeleton className="w-16 h-10" />
            </section>
        </>
    );
}
export { InteractionCreationInput, InteractionCreationInputSkeleton };
