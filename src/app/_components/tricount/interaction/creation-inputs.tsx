"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Input } from "../../ui/input";
import { DatePicker } from "../../ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import { Card, CardContent, CardFooter } from "../../ui/card";
import { Loader2, ArrowLeft } from "lucide-react";
import { Skeleton } from "../../ui/skeleton";
import MultipleSelector, { type Option } from "../../ui/multi-select";
import { type User } from "@/server/db/types";

interface TricountInteractionCreationInputProps {
    user: User;
    idTri: number;
}

function TricountInteractionCreationInputs({ user, idTri }: TricountInteractionCreationInputProps) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [amount, setAmount] = useState<number>(0);
    const [categoryId, setCategoryId] = useState<number>(0);
    const [isRefunded] = useState<boolean>(false);
    const [userIdPayer, setUserIdPayer] = useState<string>("");
    const [date, setDate] = useState<Date>(new Date());
    const [usersPayees, setUsersPayees] = useState<Option[]>([]);
    const defaultsSetRef = useRef(false);

    const categories = api.tricountInteraction.getCategoriesByTricount.useQuery({ token: user.token, idTri });
    const usersInTricount = api.tricount.getUsersInTricount.useQuery({ token: user.token, idTri });

    useEffect(() => {
        if (usersInTricount.data && usersInTricount.data.length > 0 && !defaultsSetRef.current) {
            if (user.username && usersInTricount.data.includes(user.username)) {
                setUserIdPayer(user.username);
            }

            const allUsersOptions: Option[] = usersInTricount.data.map((user) => ({
                label: user,
                value: user
            }));
            setUsersPayees(allUsersOptions);

            defaultsSetRef.current = true;
        }
    }, [usersInTricount.data, user.username]);

    const utils = api.useUtils();
    const addInteractionMutation = api.tricountInteraction.createInteraction.useMutation({
        onSuccess: async () => {
            await utils.tricountInteraction.getInteractionsByTricount.invalidate({ token: user.token, idTri });
            router.push(`/tricount/${idTri}`);
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !categoryId || !amount || !userIdPayer) {
            return;
        }

        const category = categories.data?.find(c => c.id === categoryId);
        if (!category) {
            return;
        }

        const amountNumber = parseFloat(amount.toString());
        if (isNaN(amountNumber)) {
            return;
        }

        await addInteractionMutation.mutateAsync({
            token: user.token,
            idTri,
            name,
            categoryId,
            amount: amountNumber,
            userIdPayer,
            isRefunded,
            usersPayees: usersPayees.map((user) => ({
                userId: user.value,
            })),
        });
    };

    return (
        <div className="bg-linear-to-br from-background via-background to-muted/20 fixed inset-0 flex flex-col justify-center items-center p-6 overflow-y-auto">
            <div className="w-full max-w-lg">
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/tricount/${idTri}`)}
                        className="mb-4 -ml-2"
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        Retour
                    </Button>
                    <h1 className="font-semibold text-2xl tracking-tight">Nouvelle interaction</h1>
                    <p className="mt-1.5 text-muted-foreground text-sm">
                        Ajoutez une nouvelle dépense ou remboursement au tricount
                    </p>
                </div>

                <Card className="shadow-lg">
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-5 py-6">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="font-medium text-sm">
                                    Nom de l&apos;interaction
                                </Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Ex: Restaurant, Courses..."
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="h-10"
                                    required
                                />
                            </div>

                            <div className="gap-4 grid grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="date" className="font-medium text-sm">
                                        Date
                                    </Label>
                                    <DatePicker
                                        date={date}
                                        setDate={(date) => {
                                            if (date) setDate(date);
                                        }}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="font-medium text-sm">
                                        Montant
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        step="0.01"
                                        min="0"
                                        value={amount || ""}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        className="h-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="font-medium text-sm">
                                    Catégorie
                                </Label>
                                <Select
                                    value={categoryId ? categoryId.toString() : ""}
                                    onValueChange={(value) => setCategoryId(Number(value))}
                                >
                                    <SelectTrigger id="category" className="w-full h-10">
                                        <SelectValue placeholder="Sélectionnez une catégorie" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.data?.map((category) => (
                                            <SelectItem key={category.id} value={category.id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payer" className="font-medium text-sm">
                                    Utilisateur qui a payé
                                </Label>
                                <Select value={userIdPayer} onValueChange={setUserIdPayer}>
                                    <SelectTrigger id="payer" className="w-full h-10">
                                        <SelectValue placeholder="Sélectionnez un utilisateur" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {usersInTricount.data?.map((user) => (
                                            <SelectItem key={user} value={user}>{user}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="payer" className="font-medium text-sm">
                                    Utilisateur(s) bénéficiaire(s)
                                </Label>
                                <MultipleSelector
                                    value={usersPayees}
                                    onChange={setUsersPayees}
                                    options={usersInTricount.data?.map((user) => ({
                                        label: user,
                                        value: user
                                    })) ?? []}
                                    placeholder="Sélectionnez un utilisateur"
                                    className="h-10"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="border-t flex justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push(`/tricount/${idTri}`)}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                disabled={addInteractionMutation.isPending || !name || !categoryId || !amount || !userIdPayer}
                                className="min-w-[140px]"
                            >
                                {addInteractionMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                                        Création...
                                    </>
                                ) : (
                                    "Créer l'interaction"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    )
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
    )
}
export { TricountInteractionCreationInputs, TricountInteractionCreationInputsSkeleton };