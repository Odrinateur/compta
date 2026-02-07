"use client";

import { useEffect, useMemo, useState } from "react";
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
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";

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

    const groupedTransactions = useMemo(() => {
        if (!transactions) return [];
        const byEtf = new Map<
            number | string,
            {
                etf: (typeof transactions)[number]["etf"] | null | undefined;
                items: typeof transactions;
                totals: {
                    quantity: number;
                    amount: number;
                    fees: number;
                };
            }
        >();

        transactions.forEach((transaction) => {
            const key = transaction.etf?.id ?? "unknown";
            const signedQuantity =
                transaction.side === "sell"
                    ? -transaction.quantity
                    : transaction.quantity;
            const signedAmount =
                transaction.side === "sell"
                    ? -transaction.quantity * transaction.price
                    : transaction.quantity * transaction.price;
            const fees = transaction.operationFee ?? 0;
            const existing = byEtf.get(key);
            if (existing) {
                existing.items.push(transaction);
                existing.totals.quantity += signedQuantity;
                existing.totals.amount += signedAmount;
                existing.totals.fees += fees;
            } else {
                byEtf.set(key, {
                    etf: transaction.etf,
                    items: [transaction],
                    totals: {
                        quantity: signedQuantity,
                        amount: signedAmount,
                        fees,
                    },
                });
            }
        });

        return Array.from(byEtf.values())
            .map((group) => ({
                ...group,
                items: [...group.items].sort(
                    (left, right) =>
                        new Date(right.date).getTime() -
                        new Date(left.date).getTime()
                ),
            }))
            .sort((left, right) => {
                const leftName = left.etf?.name ?? "ETF";
                const rightName = right.etf?.name ?? "ETF";
                return leftName.localeCompare(rightName, "fr");
            });
    }, [transactions]);

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
        <div className="flex flex-col gap-6 w-full">
            <div className="flex justify-between items-center">
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

            <section className="bg-card/80 shadow-sm border rounded-2xl p-4">
                <div className="flex flex-wrap justify-between items-center gap-3">
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
                    <p className="mt-2 text-rose-600 text-xs">{pasteError}</p>
                ) : null}
                <div className="gap-4 grid md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_1fr_auto] mt-4">
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
                <Skeleton className="w-full h-40" />
            ) : groupedTransactions.length > 0 ? (
                <div className="gap-4 grid">
                    {groupedTransactions.map((group) => (
                        <section
                            key={group.etf?.id ?? "unknown"}
                            className="bg-card/90 shadow-sm border rounded-2xl p-4"
                        >
                            <div className="flex flex-wrap justify-between items-center gap-2">
                                <div>
                                    <p className="font-semibold text-sm">
                                        {group.etf?.name ?? "ETF"}
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                        {group.etf?.yahooSymbol ?? ""} ·{" "}
                                        {group.items.length} operation
                                        {group.items.length > 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 overflow-x-auto">
                                <table className="border-separate border-spacing-y-2 w-full min-w-[720px] text-sm">
                                    <thead className="text-muted-foreground text-xs">
                                        <tr>
                                            <th className="px-3 text-left">
                                                Date
                                            </th>
                                            <th className="px-3 text-left">
                                                Type
                                            </th>
                                            <th className="px-3 text-right">
                                                Quantite
                                            </th>
                                            <th className="px-3 text-right">
                                                Prix
                                            </th>
                                            <th className="px-3 text-right">
                                                Total
                                            </th>
                                            <th className="px-3 text-right">
                                                Frais
                                            </th>
                                            <th className="px-3 text-right">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.items.map((transaction) => (
                                            <tr
                                                key={transaction.id}
                                                className="bg-background/80"
                                            >
                                                <td className="rounded-l-xl px-3 py-3">
                                                    <p className="font-medium">
                                                        {formatDate(
                                                            transaction.date
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            transaction.side ===
                                                            "sell"
                                                                ? "bg-rose-500/15 text-rose-600"
                                                                : "bg-emerald-500/15 text-emerald-600"
                                                        }`}
                                                    >
                                                        {transaction.side ===
                                                        "sell"
                                                            ? "Vente"
                                                            : "Achat"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 font-semibold tabular-nums text-right">
                                                    {transaction.quantity}
                                                </td>
                                                <td className="px-3 py-3 font-semibold tabular-nums text-right">
                                                    {formatCurrency(
                                                        transaction.price,
                                                        3
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 font-semibold tabular-nums text-right">
                                                    {formatCurrency(
                                                        transaction.quantity *
                                                            transaction.price,
                                                        3
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 font-semibold tabular-nums text-right">
                                                    {formatCurrency(
                                                        transaction.operationFee ??
                                                            0,
                                                        2
                                                    )}
                                                </td>
                                                <td className="rounded-r-xl px-3 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-rose-600 hover:text-rose-700"
                                                            onClick={() =>
                                                                deleteTransactionMutation.mutate(
                                                                    {
                                                                        token: user.token,
                                                                        id: transaction.id,
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            <Trash2Icon className="mr-1 w-4 h-4" />
                                                            Supprimer
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/40">
                                            <td className="rounded-l-xl px-3 py-3 font-semibold text-muted-foreground text-xs">
                                                Total net
                                            </td>
                                            <td className="px-3 py-3 text-muted-foreground text-xs text-right">
                                                -
                                            </td>
                                            <td className="px-3 py-3 font-semibold tabular-nums text-right">
                                                {group.totals.quantity}
                                            </td>
                                            <td className="px-3 py-3 text-muted-foreground text-xs text-right">
                                                -
                                            </td>
                                            <td className="px-3 py-3 font-semibold tabular-nums text-right">
                                                {formatCurrency(
                                                    group.totals.amount,
                                                    3
                                                )}
                                            </td>
                                            <td className="px-3 py-3 font-semibold tabular-nums text-right">
                                                {formatCurrency(
                                                    group.totals.fees,
                                                    2
                                                )}
                                            </td>
                                            <td className="rounded-r-xl px-3 py-3 text-muted-foreground text-xs text-right">
                                                -
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <div className="bg-card/70 border rounded-2xl p-10 text-muted-foreground text-center">
                    Aucune transaction pour le moment.
                </div>
            )}
        </div>
    );
}

export { StocksTransactions };
