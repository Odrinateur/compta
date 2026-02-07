"use client";

import { useMemo } from "react";
import { api } from "@/trpc/react";
import { type MeUser } from "@/server/db/types";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useRouter, usePathname } from "next/navigation";

interface StocksPnlProps {
    user: MeUser;
    limit?: number;
}

const buildSparklinePath = (trendValue: number) => {
    const isUp = trendValue >= 0;
    const start = isUp ? 34 : 14;
    const end = isUp ? 14 : 34;
    const points = Array.from({ length: 6 }, (_, index) => {
        const t = index / 5;
        const x = t * 120;
        const wave = Math.sin(t * Math.PI * 2) * 3;
        const y = start + (end - start) * t + wave;
        return { x, y };
    });

    return points
        .map(
            (point, index) =>
                `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
        )
        .join(" ");
};

const getAvatarGradient = (etfId: number) => {
    const hue = (etfId * 57) % 360;
    return {
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 55%), hsl(${(hue + 38) % 360} 70% 45%))`,
    };
};

function StocksPnl({ user, limit }: StocksPnlProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { data, isLoading } = api.stocks.getPnlSummary.useQuery({
        token: user.token,
    });

    const list = useMemo(() => {
        if (!data) return [];
        const sorted = [...data].sort((a, b) => {
            const aHoldingValue = a.quantity * a.currentPrice;
            const bHoldingValue = b.quantity * b.currentPrice;
            const aIsEmpty = aHoldingValue === 0 && a.invested === 0;
            const bIsEmpty = bHoldingValue === 0 && b.invested === 0;

            // Mettre les éléments vides en dernier
            if (aIsEmpty && !bIsEmpty) return 1;
            if (!aIsEmpty && bIsEmpty) return -1;

            // Sinon, trier par totalPnl décroissant
            return b.totalPnl - a.totalPnl;
        });
        return typeof limit === "number" ? sorted.slice(0, limit) : sorted;
    }, [data, limit]);

    const handleClick = (etfId: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set("etf", String(etfId));
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            {isLoading ? (
                <Skeleton className="w-full h-40" />
            ) : list.length > 0 ? (
                <div className="gap-4 grid md:grid-cols-2 xl:grid-cols-3">
                    {list.map((etf, index) => {
                        const holdingValue = etf.quantity * etf.currentPrice;
                        const pnlPercent =
                            etf.invested > 0
                                ? (etf.totalPnl / etf.invested) * 100
                                : 0;
                        const pnlClass =
                            etf.totalPnl >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400";
                        const sparklinePath = buildSparklinePath(etf.totalPnl);
                        const sparklineId = `sparkline-${etf.etfId}`;

                        return (
                            <div
                                key={etf.etfId}
                                className={`bg-card/90 group relative cursor-pointer overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${holdingValue === 0 && etf.invested === 0 ? "opacity-70" : ""}`}
                                onClick={() => handleClick(etf.etfId)}
                            >
                                <div className="bg-[radial-gradient(circle_at_top,_hsl(var(--color-primary)/0.12),transparent_60%)] absolute inset-0 pointer-events-none" />
                                <div className="relative flex justify-between items-start gap-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="shadow-sm rounded-full flex justify-center items-center w-12 h-12 font-semibold text-white text-sm"
                                            style={getAvatarGradient(etf.etfId)}
                                        >
                                            {etf.etfName
                                                .split(" ")
                                                .slice(0, 2)
                                                .map((part) => part[0])
                                                .join("")
                                                .toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">
                                                {etf.etfName}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {etf.yahooName} ·{" "}
                                                {etf.yahooSymbol}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-muted-foreground text-xs">
                                        #{index + 1}
                                    </div>
                                </div>

                                <div className="relative gap-4 grid lg:grid-cols-[1.2fr_0.8fr] mt-5">
                                    <div className="flex flex-col gap-2">
                                        <div>
                                            <p className="text-muted-foreground text-xs">
                                                Plus-value totale
                                            </p>
                                            <p
                                                className={`text-2xl font-semibold tabular-nums ${pnlClass}`}
                                            >
                                                {etf.totalPnl >= 0 ? "+" : ""}
                                                {formatCurrency(
                                                    etf.totalPnl,
                                                    3
                                                )}
                                            </p>
                                            <p className="tabular-nums text-muted-foreground text-xs">
                                                {pnlPercent >= 0 ? "+" : ""}
                                                {pnlPercent.toFixed(2)}%
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap gap-3 text-muted-foreground text-xs">
                                            <span>
                                                Valeur:{" "}
                                                {formatCurrency(
                                                    holdingValue,
                                                    3
                                                )}
                                            </span>
                                            <span>
                                                Investi:{" "}
                                                {formatCurrency(
                                                    etf.invested,
                                                    3
                                                )}
                                            </span>
                                            <span>
                                                Realise:{" "}
                                                {formatCurrency(
                                                    etf.realizedPnl,
                                                    3
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-end items-center">
                                        <svg
                                            className="w-full max-w-[180px] h-16"
                                            viewBox="0 0 120 48"
                                            fill="none"
                                        >
                                            <defs>
                                                <linearGradient
                                                    id={sparklineId}
                                                    x1="0"
                                                    x2="0"
                                                    y1="0"
                                                    y2="1"
                                                >
                                                    <stop
                                                        offset="0%"
                                                        stopColor={
                                                            etf.totalPnl >= 0
                                                                ? "#10b981"
                                                                : "#f43f5e"
                                                        }
                                                        stopOpacity="0.35"
                                                    />
                                                    <stop
                                                        offset="100%"
                                                        stopColor={
                                                            etf.totalPnl >= 0
                                                                ? "#10b981"
                                                                : "#f43f5e"
                                                        }
                                                        stopOpacity="0"
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <path
                                                d={sparklinePath}
                                                stroke={
                                                    etf.totalPnl >= 0
                                                        ? "#10b981"
                                                        : "#f43f5e"
                                                }
                                                strokeWidth="2.5"
                                            />
                                            <path
                                                d={`${sparklinePath} L 120 48 L 0 48 Z`}
                                                fill={`url(#${sparklineId})`}
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-card/70 border rounded-2xl p-10 text-muted-foreground text-center">
                    Aucune plus-value enregistree pour le moment.
                </div>
            )}
        </div>
    );
}

export { StocksPnl };
