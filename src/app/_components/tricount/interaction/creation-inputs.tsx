"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Input } from "../../ui/input";
import { DatePicker } from "../../ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../ui/select";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Card, CardContent, CardFooter } from "../../ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Skeleton } from "../../ui/skeleton";
import MultipleSelector, { type Option } from "../../ui/multi-select";
import { type MeUser, type TricountInteraction } from "@/server/db/types";
import Link from "next/link";

interface TricountInteractionFormProps {
    user: MeUser;
    idTri: number;
    interaction?: TricountInteraction;
}

function TricountInteractionForm({
    user,
    idTri,
    interaction,
}: TricountInteractionFormProps) {
    const router = useRouter();
    const isEditMode = !!interaction;

    const [name, setName] = useState(interaction?.name ?? "");
    const [amount, setAmount] = useState<number>(
        interaction ? (interaction.amount ?? 0) / 100 : 0
    );
    const [categoryId, setCategoryId] = useState<number>(
        interaction?.categoryId ?? 0
    );
    const [isRefunded] = useState<boolean>(interaction?.isRefunded ?? false);
    const [usernamePayer, setUsernamePayer] = useState<string | undefined>(
        interaction?.usernamePayer
    );
    const [date, setDate] = useState<Date>(
        interaction ? new Date(interaction.date) : new Date()
    );
    const [usersPayees, setUsersPayees] = useState<Option[]>(
        interaction?.usersPayees.map((p) => ({
            label: p.username,
            value: p.username,
        })) ?? []
    );
    const defaultsSetRef = useRef(isEditMode);

    const categories = api.tricountCategory.getCategoriesByTricount.useQuery({
        token: user.token,
        idTri,
    });
    const usersInTricount = api.tricount.getUsersInTricount.useQuery({
        token: user.token,
        idTri,
    });
    const categoriesRegexes =
        api.tricountCategory.getCategoriesRegexes.useQuery({
            token: user.token,
            idTri,
        });

    useEffect(() => {
        if (
            usersInTricount.data &&
            usersInTricount.data.length > 0 &&
            !defaultsSetRef.current
        ) {
            if (
                user.username &&
                usersInTricount.data.some((u) => u.username === user.username)
            ) {
                setUsernamePayer(user.username);
            }

            const allUsersOptions: Option[] = usersInTricount.data.map((u) => ({
                label: u.username,
                value: u.username,
            }));
            setUsersPayees(allUsersOptions);

            defaultsSetRef.current = true;
        }
    }, [usersInTricount.data, user.username]);

    const utils = api.useUtils();

    const addInteractionMutation =
        api.tricountInteraction.createInteraction.useMutation({
            onSuccess: async () => {
                await utils.tricountInteraction.getInteractionsByTricount.invalidate(
                    {
                        token: user.token,
                        idTri,
                    }
                );
                router.push(`/tricount/${idTri}`);
            },
        });

    const updateInteractionMutation =
        api.tricountInteraction.updateInteraction.useMutation({
            onSuccess: async () => {
                await utils.tricountInteraction.getInteractionsByTricount.invalidate(
                    {
                        token: user.token,
                        idTri,
                    }
                );
                router.push(`/tricount/${idTri}`);
            },
        });

    const handleEditName = (name: string) => {
        const categoryRegex = categoriesRegexes.data?.find((c) =>
            c.regexes.find((r) =>
                name.toLowerCase().includes(r.regex.toLowerCase())
            )
        );
        if (categoryRegex) {
            setCategoryId(categoryRegex.id);
        }

        setName(name);
    };

    const isPending =
        addInteractionMutation.isPending || updateInteractionMutation.isPending;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !categoryId || !amount || !usernamePayer) {
            return;
        }

        const category = categories.data?.find((c) => c.id === categoryId);
        if (!category) {
            return;
        }

        const amountNumber = parseFloat(amount.toString());
        if (isNaN(amountNumber)) {
            return;
        }

        const payload = {
            token: user.token,
            idTri,
            name,
            categoryId,
            amount: amountNumber,
            usernamePayer,
            isRefunded,
            usersPayees: usersPayees.map((user) => ({
                username: user.value,
            })),
            date: date.toISOString(),
        };

        if (isEditMode && interaction) {
            await updateInteractionMutation.mutateAsync({
                ...payload,
                idInteraction: interaction.id,
            });
        } else {
            await addInteractionMutation.mutateAsync(payload);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center w-full overflow-y-auto">
            <div className="flex flex-col justify-center items-center gap-4 w-full">
                <div className="flex justify-start items-center gap-2">
                    <Link href={`/tricount/${idTri}`}>
                        <Button size="icon">
                            <ArrowLeft />
                        </Button>
                    </Link>
                    <h1 className="font-semibold text-2xl tracking-tight">
                        {isEditMode
                            ? "Modifier l'interaction"
                            : "Nouvelle interaction"}
                    </h1>
                </div>

                <Card className="shadow-lg">
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-5 py-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="name"
                                    className="font-medium text-sm"
                                >
                                    Nom de l&apos;interaction
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Ex: Restaurant, Courses..."
                                    value={name}
                                    onChange={(e) =>
                                        handleEditName(e.target.value)
                                    }
                                    className="h-10"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div className="flex sm:flex-row flex-col gap-4">
                                <div className="space-y-2 w-full">
                                    <Label
                                        htmlFor="date"
                                        className="font-medium text-sm"
                                    >
                                        Date
                                    </Label>
                                    <DatePicker
                                        date={date}
                                        setDate={(date) => {
                                            if (date) setDate(date);
                                        }}
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-2 w-full">
                                    <Label
                                        htmlFor="amount"
                                        className="font-medium text-sm"
                                    >
                                        Montant
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        inputMode="decimal"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        value={amount || ""}
                                        onChange={(e) =>
                                            setAmount(Number(e.target.value))
                                        }
                                        className="h-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="category"
                                    className="font-medium text-sm"
                                >
                                    Catégorie
                                </Label>
                                <Select
                                    value={
                                        categoryId ? categoryId.toString() : ""
                                    }
                                    onValueChange={(value) =>
                                        setCategoryId(Number(value))
                                    }
                                >
                                    <SelectTrigger
                                        id="category"
                                        className="w-full h-10"
                                    >
                                        <SelectValue placeholder="Sélectionnez une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.data?.map((category) => (
                                            <SelectItem
                                                key={category.id}
                                                value={category.id.toString()}
                                            >
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 pt-2 sm:pt-0">
                                <Label
                                    htmlFor="payer"
                                    className="hidden sm:block font-medium text-sm"
                                >
                                    Utilisateur qui a payé
                                </Label>
                                <Select
                                    value={usernamePayer}
                                    onValueChange={setUsernamePayer}
                                >
                                    <SelectTrigger
                                        id="payer"
                                        className="w-full h-10"
                                    >
                                        <SelectValue placeholder="Sélectionnez un utilisateur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {usersInTricount.data?.map((u) => (
                                            <SelectItem
                                                key={u.username}
                                                value={u.username}
                                            >
                                                {u.username}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="payer"
                                    className="hidden sm:block font-medium text-sm"
                                >
                                    Utilisateur(s) bénéficiaire(s)
                                </Label>
                                <MultipleSelector
                                    value={usersPayees}
                                    onChange={setUsersPayees}
                                    options={
                                        usersInTricount.data?.map((u) => ({
                                            label: u.username,
                                            value: u.username,
                                        })) ?? []
                                    }
                                    placeholder="Sélectionnez un utilisateur"
                                    className="h-10"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.push(`/tricount/${idTri}`)
                                }
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isPending ||
                                    !name ||
                                    !categoryId ||
                                    !amount ||
                                    !usernamePayer
                                }
                                className="min-w-[140px]"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                        Création...
                                    </>
                                ) : isEditMode ? (
                                    "Modifier l'interaction"
                                ) : (
                                    "Créer l'interaction"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

function TricountInteractionCreationInputsSkeleton() {
    return (
        <div className="bg-linear-to-br from-background via-background to-muted/20 fixed inset-0 flex flex-col justify-center items-center p-6 overflow-y-auto">
            <div className="w-full max-w-lg">
                <div className="mb-6">
                    <Skeleton className="mb-4 w-20 h-9" />
                    <Skeleton className="w-48 h-8" />
                    <Skeleton className="mt-2 w-64 h-4" />
                </div>
                <Card className="shadow-lg">
                    <CardContent className="space-y-5 pt-6">
                        <div className="space-y-2">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-full h-10" />
                        </div>
                        <div className="gap-4 grid grid-cols-2">
                            <div className="space-y-2">
                                <Skeleton className="w-16 h-4" />
                                <Skeleton className="w-full h-10" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="w-20 h-4" />
                                <Skeleton className="w-full h-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="w-24 h-4" />
                            <Skeleton className="w-full h-10" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="w-40 h-4" />
                            <Skeleton className="w-full h-10" />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t flex justify-end gap-3 pt-6 pb-6">
                        <Skeleton className="w-24 h-9" />
                        <Skeleton className="w-40 h-9" />
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
export { TricountInteractionForm, TricountInteractionCreationInputsSkeleton };
