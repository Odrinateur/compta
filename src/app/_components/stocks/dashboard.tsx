"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import { Button } from "@/app/_components/ui/button";
import { ResponsiveTooltip } from "@/app/_components/ui/responsive-tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/_components/ui/select";
import { H3 } from "@/app/_components/ui/typography";
import { formatCurrency } from "@/lib/utils";
import { ListIcon, SettingsIcon } from "lucide-react";
import Link from "next/link";
import { PriceChart } from "@/app/_components/stocks/price-chart";
import { StocksPnl } from "./pnl";
import { computePositionWithFees } from "@/lib/stocks/pnl";

type RangeValue =
    | "1d"
    | "1w"
    | "1m"
    | "ytd"
    | "1y"
    | "2y"
    | "5y"
    | "10y"
    | "all";

const rangeOptions: Array<{ value: RangeValue; label: string }> = [
    { value: "1d", label: "1J" },
    { value: "1w", label: "1S" },
    { value: "1m", label: "1M" },
    { value: "ytd", label: "YTD" },
    { value: "1y", label: "1A" },
    { value: "2y", label: "2A" },
    { value: "5y", label: "5A" },
    { value: "10y", label: "10A" },
    { value: "all", label: "ALL" },
];

const rangeLabels = new Map(
    rangeOptions.map((option) => [option.value, option.label])
);

interface StocksDashboardProps {
    user: MeUser;
    initialEtfId?: number;
    initialRange?: string;
}

function StocksDashboard({
    user,
    initialEtfId,
    initialRange,
}: StocksDashboardProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isUpdatingFromState = useRef(false);
    const [selectedEtfId, setSelectedEtfId] = useState<number | undefined>(
        Number.isFinite(initialEtfId) ? initialEtfId : undefined
    );
    const [selectedRange, setSelectedRange] = useState<RangeValue>(
        rangeOptions.find((option) => option.value === initialRange)?.value ??
            "ytd"
    );

    const { data: etfs } = api.stocks.getEtfs.useQuery({ token: user.token });
    const { data: history, isLoading: isLoadingHistory } =
        api.stocks.getPortfolioHistory.useQuery({
            token: user.token,
            range: selectedRange,
            etfId: selectedEtfId,
        });
    const { data: transactions } = api.stocks.getTransactions.useQuery({
        token: user.token,
        etfId: selectedEtfId,
    });
    const { data: pnlSummary } = api.stocks.getPnlSummary.useQuery({
        token: user.token,
    });

    // Synchroniser le state avec les paramètres d'URL (quand l'URL change depuis l'extérieur)
    useEffect(() => {
        if (isUpdatingFromState.current) {
            isUpdatingFromState.current = false;
            return;
        }

        const etfParam = searchParams.get("etf");
        const rangeParam = searchParams.get("range");

        if (etfParam) {
            const etfId = Number(etfParam);
            if (Number.isFinite(etfId)) {
                setSelectedEtfId(etfId);
            }
        } else {
            setSelectedEtfId(undefined);
        }

        if (rangeParam) {
            const validRange = rangeOptions.find(
                (option) => option.value === rangeParam
            )?.value;
            if (validRange) {
                setSelectedRange(validRange);
            }
        }
    }, [searchParams]);

    // Synchroniser l'URL avec le state (quand le state change depuis l'interface)
    useEffect(() => {
        const currentEtf = searchParams.get("etf");
        const currentRange = searchParams.get("range");
        const expectedEtf = selectedEtfId ? String(selectedEtfId) : null;
        const expectedRange = selectedRange;

        const needsUpdate =
            currentEtf !== expectedEtf || currentRange !== expectedRange;

        if (needsUpdate) {
            const params = new URLSearchParams();
            if (selectedEtfId) {
                params.set("etf", String(selectedEtfId));
            }
            params.set("range", selectedRange);
            isUpdatingFromState.current = true;
            router.replace(`/stocks?${params.toString()}`, { scroll: false });
        }
    }, [router, searchParams, selectedEtfId, selectedRange]);

    const series = useMemo(() => {
        const raw = history?.series ?? [];
        return raw.filter(
            (point: { value: number }) =>
                Number.isFinite(point.value) && point.value > 0
        );
    }, [history?.series]);
    const transactionPoints = useMemo(() => {
        if (!history?.transactions || series.length === 0) return [];

        const rangeStart = series[0]!.timestamp;
        const rangeEnd = series[series.length - 1]!.timestamp;

        const toDayKey = (timestamp: number) => {
            const date = new Date(timestamp);
            const year = date.getFullYear();
            const month = date.getMonth();
            const day = date.getDate();
            return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        };

        const toDayStart = (timestamp: number) => {
            const date = new Date(timestamp);
            return new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate()
            ).getTime();
        };

        const mergedBuys = new Map<
            string,
            {
                id: number;
                timestamp: number;
                quantity: number;
                totalCost: number;
            }
        >();
        const mergedSells = new Map<
            string,
            {
                id: number;
                timestamp: number;
                quantity: number;
                totalCost: number;
            }
        >();
        const result: Array<{
            id: number;
            timestamp: number;
            price: number;
            quantity: number;
            side: "buy" | "sell";
        }> = [];

        for (const transaction of history.transactions) {
            const timestamp = new Date(transaction.date).getTime();
            if (timestamp < rangeStart || timestamp > rangeEnd) continue;

            const side = transaction.side as "buy" | "sell";
            const dayKey = toDayKey(timestamp);
            const dayStart = toDayStart(timestamp);

            if (side === "buy") {
                const entry = mergedBuys.get(dayKey) ?? {
                    id: -dayStart,
                    timestamp: dayStart,
                    quantity: 0,
                    totalCost: 0,
                };
                entry.quantity += transaction.quantity;
                entry.totalCost += transaction.price * transaction.quantity;
                mergedBuys.set(dayKey, entry);
            } else {
                const entry = mergedSells.get(dayKey) ?? {
                    id: -dayStart - 1,
                    timestamp: dayStart,
                    quantity: 0,
                    totalCost: 0,
                };
                entry.quantity += transaction.quantity;
                entry.totalCost += transaction.price * transaction.quantity;
                mergedSells.set(dayKey, entry);
            }
        }

        for (const entry of mergedBuys.values()) {
            result.push({
                id: entry.id,
                timestamp: entry.timestamp,
                price:
                    entry.quantity > 0 ? entry.totalCost / entry.quantity : 0,
                quantity: entry.quantity,
                side: "buy",
            });
        }

        for (const entry of mergedSells.values()) {
            result.push({
                id: entry.id,
                timestamp: entry.timestamp,
                price:
                    entry.quantity > 0 ? entry.totalCost / entry.quantity : 0,
                quantity: entry.quantity,
                side: "sell",
            });
        }

        return result.sort((a, b) => a.timestamp - b.timestamp);
    }, [history?.transactions, series]);

    const latestPrice =
        series.length > 0 ? series[series.length - 1]!.value : 0;

    const costBasis = useMemo(() => {
        if (!transactions) {
            return {
                quantity: 0,
                invested: 0,
            };
        }

        const currentPriceMap = new Map<number, number>();
        for (const item of pnlSummary ?? []) {
            currentPriceMap.set(item.etfId, item.currentPrice);
        }

        const feeMap = new Map<number, number>();
        for (const etf of etfs ?? []) {
            feeMap.set(etf.id, etf.annualFeePercent ?? 0);
        }

        const toFeeTransaction = (tx: (typeof transactions)[number]) => ({
            date: tx.date,
            side: tx.side as "buy" | "sell",
            quantity: tx.quantity,
            price: tx.price,
            operationFee: tx.operationFee ?? 0,
        });

        if (selectedEtfId) {
            const currentPrice =
                currentPriceMap.get(selectedEtfId) ?? latestPrice;
            const feePercent =
                feeMap.get(selectedEtfId) ??
                transactions.find((tx) => tx.etfId === selectedEtfId)?.etf
                    ?.annualFeePercent ??
                0;
            const position = computePositionWithFees(
                transactions
                    .filter((tx) => tx.etfId === selectedEtfId)
                    .map(toFeeTransaction),
                feePercent,
                Date.now(),
                currentPrice
            );
            return { quantity: position.quantity, invested: position.invested };
        }

        const perEtf = new Map<
            number,
            { quantity: number; invested: number }
        >();

        for (const tx of transactions) {
            const list = perEtf.get(tx.etfId) ?? { quantity: 0, invested: 0 };
            perEtf.set(tx.etfId, list);
        }

        let invested = 0;
        let quantity = 0;
        for (const [etfId] of perEtf) {
            const feePercent =
                feeMap.get(etfId) ??
                transactions.find((tx) => tx.etfId === etfId)?.etf
                    ?.annualFeePercent ??
                0;
            const currentPrice = currentPriceMap.get(etfId);
            const position = computePositionWithFees(
                transactions
                    .filter((tx) => tx.etfId === etfId)
                    .map(toFeeTransaction),
                feePercent,
                Date.now(),
                currentPrice
            );
            invested += position.invested;
            quantity += position.quantity;
        }

        return { quantity, invested };
    }, [transactions, selectedEtfId, etfs, pnlSummary, latestPrice]);

    const pnlTotals = useMemo(() => {
        if (!pnlSummary || pnlSummary.length === 0) return null;
        let invested = 0;
        let totalPnl = 0;
        for (const item of pnlSummary) {
            invested += item.invested;
            totalPnl += item.totalPnl;
        }
        return {
            invested,
            totalPnl,
            value: invested + totalPnl,
        };
    }, [pnlSummary]);

    const selectedEtfSummary = useMemo(() => {
        if (!pnlSummary || !selectedEtfId) return null;
        return pnlSummary.find((item) => item.etfId === selectedEtfId) ?? null;
    }, [pnlSummary, selectedEtfId]);

    const isEtfView = Boolean(selectedEtfId);
    const holdingValue = isEtfView
        ? costBasis.quantity * latestPrice
        : latestPrice;
    const portfolioValue =
        !isEtfView && pnlTotals ? pnlTotals.value : holdingValue;
    const investedValue =
        !isEtfView && pnlTotals
            ? pnlTotals.invested
            : (selectedEtfSummary?.invested ?? costBasis.invested);
    const gainValue =
        !isEtfView && pnlTotals
            ? pnlTotals.totalPnl
            : (selectedEtfSummary?.totalPnl ??
              holdingValue - costBasis.invested);
    const gainPercent =
        investedValue > 0 ? (gainValue / investedValue) * 100 : 0;
    const realizedGainValue = isEtfView
        ? (selectedEtfSummary?.realizedPnl ?? 0)
        : null;
    const unrealizedGainValue = isEtfView
        ? (selectedEtfSummary?.unrealizedPnl ??
          holdingValue - costBasis.invested)
        : null;

    const filterLabel = selectedEtfId
        ? (etfs?.find((etf) => etf.id === selectedEtfId)?.name ?? "ETF")
        : "Tous les ETFs";

    return (
        <div className="flex w-full flex-col gap-6">
            <div className="flex items-center justify-between">
                <H3>Stocks</H3>
                <div className="flex items-center gap-2">
                    <Link href="/stocks/transactions">
                        <Button variant="outline" size="icon">
                            <ListIcon className="size-4" />
                        </Button>
                    </Link>
                    <Link href="/stocks/settings">
                        <Button size="icon">
                            <SettingsIcon className="size-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            <section className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    <Select
                        value={selectedEtfId ? String(selectedEtfId) : "all"}
                        onValueChange={(value) =>
                            setSelectedEtfId(
                                value === "all" ? undefined : Number(value)
                            )
                        }
                    >
                        <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Filtrer un ETF" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tous les ETFs</SelectItem>
                            {etfs?.map((etf) => (
                                <SelectItem key={etf.id} value={String(etf.id)}>
                                    {etf.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedRange}
                        onValueChange={(value) =>
                            setSelectedRange(value as RangeValue)
                        }
                    >
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Periode" />
                        </SelectTrigger>
                        <SelectContent>
                            {rangeOptions.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex w-full flex-wrap justify-center gap-6 text-right md:w-auto md:justify-end">
                    <div>
                        <p className="text-muted-foreground text-xs">
                            {isEtfView ? "Cours" : "Valeur"}
                        </p>
                        <p className="text-lg font-semibold tabular-nums">
                            {formatCurrency(portfolioValue, 3)}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-xs">
                            {isEtfView ? "Prix moyen" : "Investi"}
                        </p>
                        <p className="text-lg font-semibold tabular-nums">
                            {formatCurrency(
                                isEtfView && costBasis.quantity > 0
                                    ? costBasis.invested / costBasis.quantity
                                    : investedValue,
                                3
                            )}
                        </p>
                    </div>
                    {isEtfView ? (
                        <div>
                            <p className="text-muted-foreground text-xs">
                                Position
                            </p>
                            <p className="text-lg font-semibold tabular-nums">
                                {costBasis.quantity} /{" "}
                                {costBasis.quantity > 0
                                    ? formatCurrency(costBasis.invested, 3)
                                    : formatCurrency(0, 3)}
                            </p>
                        </div>
                    ) : null}

                    <div>
                        <p className="text-muted-foreground text-xs">
                            Plus-value
                        </p>
                        {isEtfView ? (
                            <ResponsiveTooltip
                                side="top"
                                content={
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Realisee</span>
                                            <span className="tabular-nums">
                                                {realizedGainValue !== null &&
                                                realizedGainValue >= 0
                                                    ? "+"
                                                    : ""}
                                                {formatCurrency(
                                                    realizedGainValue ?? 0,
                                                    3
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Latente</span>
                                            <span className="tabular-nums">
                                                {unrealizedGainValue !== null &&
                                                unrealizedGainValue >= 0
                                                    ? "+"
                                                    : ""}
                                                {formatCurrency(
                                                    unrealizedGainValue ?? 0,
                                                    3
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                }
                            >
                                <p className="text-lg font-semibold tabular-nums">
                                    {gainValue >= 0 ? "+" : ""}
                                    {formatCurrency(gainValue, 3)}
                                </p>
                            </ResponsiveTooltip>
                        ) : (
                            <p className="text-lg font-semibold tabular-nums">
                                {gainValue >= 0 ? "+" : ""}
                                {formatCurrency(gainValue, 3)}
                            </p>
                        )}
                        <p className="text-muted-foreground text-xs tabular-nums">
                            {gainPercent >= 0 ? "+" : ""}
                            {gainPercent.toFixed(2)}%
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-background rounded-xl border p-4">
                <PriceChart
                    series={series}
                    transactions={transactionPoints}
                    isLoading={isLoadingHistory}
                    filterLabel={filterLabel}
                    rangeLabel={rangeLabels.get(selectedRange)}
                />
            </section>

            <StocksPnl user={user} limit={6} />
        </div>
    );
}

export { StocksDashboard };
