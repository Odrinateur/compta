"use client";

import { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import { Button } from "@/app/_components/ui/button";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { Input } from "@/app/_components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/_components/ui/select";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { H3, Link } from "@/app/_components/ui/typography";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    matchEtfName,
    parseStockTransactionText,
} from "@/lib/stocks/parse-transaction-text";
import { ArrowLeftIcon } from "lucide-react";

interface StocksTransactionsProps {
    user: MeUser;
}

function StocksTransactions({ user }: StocksTransactionsProps) {
    const utils = api.useUtils();
    const { data: etfs } = api.stocks.getEtfs.useQuery({ token: user.token });
    const { data: transactions, isLoading: isLoadingTransactions } =
        api.stocks.getTransactions.useQuery({
            token: user.token,
        });

    const createTransactionMutation = api.stocks.createTransaction.useMutation({
        onSuccess: () => {
            void utils.stocks.getTransactions.invalidate({
                token: user.token,
            });
            void utils.stocks.getPortfolioHistory.invalidate({
                token: user.token,
                range: "ytd",
            });
            void utils.stocks.getPnlSummary.invalidate({
                token: user.token,
            });
        },
    });
    const deleteTransactionMutation = api.stocks.deleteTransaction.useMutation({
        onSuccess: () => {
            void utils.stocks.getTransactions.invalidate({
                token: user.token,
            });
            void utils.stocks.getPortfolioHistory.invalidate({
                token: user.token,
                range: "ytd",
            });
            void utils.stocks.getPnlSummary.invalidate({
                token: user.token,
            });
        },
    });

    const [newDate, setNewDate] = useState<Date | undefined>(new Date());
    const [newQuantity, setNewQuantity] = useState<number | "">("");
    const [newPrice, setNewPrice] = useState<number | "">("");
    const [newOperationFee, setNewOperationFee] = useState<number | "">("");
    const [newSide, setNewSide] = useState<"buy" | "sell">("buy");
    const [newEtfId, setNewEtfId] = useState<number | undefined>(undefined);
    const [pasteError, setPasteError] = useState<string | null>(null);
    const [isPasting, setIsPasting] = useState(false);

    useEffect(() => {
        if (!newEtfId && etfs && etfs.length > 0) {
            setNewEtfId(etfs[0]!.id);
        }
    }, [etfs, newEtfId]);

    const parsedOperationFee =
        newOperationFee === "" ? null : Number(newOperationFee);
    const isOperationFeeValid =
        parsedOperationFee !== null &&
        Number.isFinite(parsedOperationFee) &&
        parsedOperationFee >= 0;

    const canCreateTransaction =
        Boolean(newEtfId) &&
        newDate &&
        newQuantity !== "" &&
        newPrice !== "" &&
        isOperationFeeValid &&
        Number(newQuantity) > 0 &&
        Number(newPrice) > 0;

    const handleCreateTransaction = () => {
        if (!newEtfId || !canCreateTransaction) return;
        const formattedDate = newDate.toLocaleDateString("en-CA");
        createTransactionMutation.mutate({
            token: user.token,
            etfId: newEtfId,
            date: formattedDate,
            side: newSide,
            quantity: Number(newQuantity),
            price: Number(newPrice),
            operationFee: parsedOperationFee ?? 0,
        });
        setNewDate(new Date());
        setNewQuantity("");
        setNewPrice("");
        setNewOperationFee("");
    };

    const handlePasteFromClipboard = async () => {
        if (isPasting) return;
        setIsPasting(true);
        setPasteError(null);
        try {
            const text = await navigator.clipboard.readText();
            const parsed = parseStockTransactionText(text);
            if (!parsed) {
                setPasteError(
                    "Impossible de lire le texte. Verifiez le format de l'ordre."
                );
                return;
            }
            const matchedEtf = etfs ? matchEtfName(parsed.etfName, etfs) : null;
            if (matchedEtf) {
                setNewEtfId(matchedEtf.id);
            }
            setNewSide(parsed.side);
            setNewDate(parsed.date);
            setNewQuantity(parsed.quantity);
            setNewPrice(parsed.price);
            setNewOperationFee(parsed.operationFee ?? "");
        } catch {
            setPasteError("Acces au presse-papiers refuse.");
        } finally {
            setIsPasting(false);
        }
    };

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/stocks">
                        <Button size="icon">
                            <ArrowLeftIcon />
                        </Button>
                    </Link>
                    <H3>Historique des transactions</H3>
                </div>
                <p className="text-muted-foreground text-xs">
                    {transactions?.length ?? 0} operation
                    {transactions && transactions.length > 1 ? "s" : ""}
                </p>
            </div>

            <section className="bg-card/80 rounded-2xl border p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-muted-foreground text-xs">
                        Collez votre avis d'ordre pour pre-remplir le
                        formulaire.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePasteFromClipboard}
                        disabled={isPasting}
                    >
                        {isPasting ? "Lecture..." : "Lire le presse-papiers"}
                    </Button>
                </div>
                {pasteError ? (
                    <p className="mt-2 text-xs text-rose-600">{pasteError}</p>
                ) : null}
                <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto]">
                    <div className="flex flex-col">
                        <label className="text-muted-foreground text-xs">
                            ETF
                        </label>
                        <Select
                            value={newEtfId ? String(newEtfId) : ""}
                            onValueChange={(value) =>
                                setNewEtfId(value ? Number(value) : undefined)
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choisir un ETF" />
                            </SelectTrigger>
                            <SelectContent>
                                {etfs?.map((etf) => (
                                    <SelectItem
                                        key={etf.id}
                                        value={String(etf.id)}
                                    >
                                        {etf.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-muted-foreground text-xs">
                            Type
                        </label>
                        <Select
                            value={newSide}
                            onValueChange={(value) =>
                                setNewSide(value as "buy" | "sell")
                            }
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="buy">Achat</SelectItem>
                                <SelectItem value="sell">Vente</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col">
                        <label className="text-muted-foreground text-xs">
                            Date
                        </label>
                        <DatePicker date={newDate} setDate={setNewDate} />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-muted-foreground text-xs">
                            Quantite
                        </label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.0001"
                            value={newQuantity}
                            onChange={(event) =>
                                setNewQuantity(
                                    event.target.value
                                        ? Number(event.target.value)
                                        : ""
                                )
                            }
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-muted-foreground text-xs">
                            Prix (EUR)
                        </label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.001"
                            value={newPrice}
                            onChange={(event) =>
                                setNewPrice(
                                    event.target.value
                                        ? Number(event.target.value)
                                        : ""
                                )
                            }
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-muted-foreground text-xs">
                            Frais (EUR)
                        </label>
                        <Input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="0.01"
                            value={newOperationFee}
                            onChange={(event) =>
                                setNewOperationFee(
                                    event.target.value
                                        ? Number(event.target.value)
                                        : ""
                                )
                            }
                        />
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={handleCreateTransaction}
                            disabled={
                                !canCreateTransaction ||
                                createTransactionMutation.isPending
                            }
                            className="w-full"
                        >
                            Ajouter
                        </Button>
                    </div>
                </div>
            </section>

            {isLoadingTransactions ? (
                <Skeleton className="h-40 w-full" />
            ) : transactions && transactions.length > 0 ? (
                <div className="grid gap-3">
                    {transactions.map((transaction) => (
                        <div
                            key={transaction.id}
                            className="bg-card/90 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${
                                        transaction.side === "sell"
                                            ? "bg-rose-500/15 text-rose-600"
                                            : "bg-emerald-500/15 text-emerald-600"
                                    }`}
                                >
                                    {transaction.side === "sell" ? "V" : "A"}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">
                                        {transaction.etf?.name ?? "ETF"}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {transaction.etf?.yahooSymbol ?? ""} ·{" "}
                                        {formatDate(transaction.date)}
                                    </p>
                                </div>
                            </div>

                            <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                                <div className="text-right">
                                    <p className="text-xs">Quantite</p>
                                    <p className="text-foreground font-semibold tabular-nums">
                                        {transaction.quantity}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs">Prix</p>
                                    <p className="text-foreground font-semibold tabular-nums">
                                        {formatCurrency(transaction.price, 3)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs">Total</p>
                                    <p className="text-foreground font-semibold tabular-nums">
                                        {formatCurrency(
                                            transaction.quantity *
                                                transaction.price,
                                            3
                                        )}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs">Frais</p>
                                    <p className="text-foreground font-semibold tabular-nums">
                                        {formatCurrency(
                                            transaction.operationFee ?? 0,
                                            2
                                        )}
                                    </p>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                    deleteTransactionMutation.mutate({
                                        token: user.token,
                                        id: transaction.id,
                                    })
                                }
                            >
                                Supprimer
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card/70 text-muted-foreground rounded-2xl border p-10 text-center">
                    Aucune transaction pour le moment.
                </div>
            )}
        </div>
    );
}

export { StocksTransactions };
