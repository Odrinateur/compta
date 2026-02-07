"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface SeriesPoint {
    timestamp: number;
    value: number;
}

interface TransactionPoint {
    id: number;
    timestamp: number;
    price: number;
    quantity: number;
    side?: "buy" | "sell";
}

interface TouchPoint {
    index: number;
    x: number;
    y: number;
    timestamp: number;
    value: number;
}

interface PriceChartProps {
    series: SeriesPoint[];
    transactions: TransactionPoint[];
    isLoading: boolean;
    filterLabel: string;
    rangeLabel?: string;
}

function PriceChart({
    series,
    transactions,
    isLoading,
    filterLabel,
    rangeLabel,
}: PriceChartProps) {
    const chartRef = useRef<HTMLDivElement | null>(null);
    const [hoverPoint, setHoverPoint] = useState<TouchPoint | null>(null);
    const [comparePoint, setComparePoint] = useState<TouchPoint | null>(null);
    const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [scrubMode, setScrubMode] = useState<"primary" | "compare" | null>(
        null
    );
    const [chartDimensions, setChartDimensions] = useState({
        width: 0,
        height: 0,
    });

    useEffect(() => {
        if (!chartRef.current) return;
        const element = chartRef.current;

        const update = () => {
            const rect = element.getBoundingClientRect();
            setChartDimensions({ width: rect.width, height: rect.height });
        };

        update();

        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, [series.length]);

    const chartPath = useMemo(() => {
        if (series.length === 0 || chartDimensions.width === 0) return "";

        const values = series.map((point) => point.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const divisor = series.length > 1 ? series.length - 1 : 1;

        return series
            .map((point, index) => {
                const x = (index / divisor) * chartDimensions.width;
                const y =
                    chartDimensions.height -
                    ((point.value - min) / range) * chartDimensions.height;
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");
    }, [series, chartDimensions.height, chartDimensions.width]);

    const chartPoints = useMemo(() => {
        if (series.length === 0 || chartDimensions.width === 0) return [];
        const values = series.map((point) => point.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const divisor = series.length > 1 ? series.length - 1 : 1;

        return series.map((point, index) => ({
            index,
            x: (index / divisor) * chartDimensions.width,
            y:
                chartDimensions.height -
                ((point.value - min) / range) * chartDimensions.height,
            timestamp: point.timestamp,
            value: point.value,
        }));
    }, [series, chartDimensions.height, chartDimensions.width]);

    const transactionMarkers = useMemo(() => {
        if (chartPoints.length === 0) return [];
        return transactions
            .map((transaction) => {
                const nearest = chartPoints.reduce((closest, point) =>
                    Math.abs(point.timestamp - transaction.timestamp) <
                    Math.abs(closest.timestamp - transaction.timestamp)
                        ? point
                        : closest
                );
                return {
                    ...transaction,
                    x: nearest.x,
                    y: nearest.y,
                };
            })
            .filter((marker) => marker.x !== undefined);
    }, [transactions, chartPoints]);

    const activeMarker = useMemo(() => {
        return (
            transactionMarkers.find((marker) => marker.id === activeMarkerId) ??
            null
        );
    }, [transactionMarkers, activeMarkerId]);

    const setHoverFromPointer = (clientX: number) => {
        if (chartPoints.length === 0 || !chartRef.current) return;
        const rect = chartRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const index = Math.round((x / rect.width) * (chartPoints.length - 1));
        const point = chartPoints[index];
        if (!point) return;
        setHoverPoint(point);
    };

    const setCompareFromPointer = (clientX: number) => {
        if (chartPoints.length === 0 || !chartRef.current) return;
        const rect = chartRef.current.getBoundingClientRect();
        const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
        const index = Math.round((x / rect.width) * (chartPoints.length - 1));
        const point = chartPoints[index];
        if (!point) return;
        setComparePoint(point);
    };

    const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length === 1) {
            setComparePoint(null);
            setHoverFromPointer(event.touches[0]!.clientX);
        } else if (event.touches.length >= 2) {
            setHoverFromPointer(event.touches[0]!.clientX);
            if (chartPoints.length > 0) {
                const rect = chartRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = Math.min(
                    Math.max(event.touches[1]!.clientX - rect.left, 0),
                    rect.width
                );
                const index = Math.round(
                    (x / rect.width) * (chartPoints.length - 1)
                );
                const point = chartPoints[index];
                if (point) setComparePoint(point);
            }
        }
    };

    const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length === 1) {
            setHoverFromPointer(event.touches[0]!.clientX);
        } else if (event.touches.length >= 2) {
            setHoverFromPointer(event.touches[0]!.clientX);
            if (chartPoints.length > 0) {
                const rect = chartRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = Math.min(
                    Math.max(event.touches[1]!.clientX - rect.left, 0),
                    rect.width
                );
                const index = Math.round(
                    (x / rect.width) * (chartPoints.length - 1)
                );
                const point = chartPoints[index];
                if (point) setComparePoint(point);
            }
        }
    };

    const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
        if (event.touches.length === 0) {
            setHoverPoint(null);
            setComparePoint(null);
        }
    };

    const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        if (!isScrubbing || !scrubMode) return;
        if (scrubMode === "compare") {
            setCompareFromPointer(event.clientX);
        } else {
            setHoverFromPointer(event.clientX);
        }
    };

    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
        setIsScrubbing(true);
        if (event.shiftKey) {
            setScrubMode("compare");
            if (!hoverPoint) {
                setHoverFromPointer(event.clientX);
            }
            setCompareFromPointer(event.clientX);
        } else {
            setScrubMode("primary");
            setHoverFromPointer(event.clientX);
        }
    };

    const handleMouseUp = () => {
        setIsScrubbing(false);
        setScrubMode(null);
    };

    const handleMouseLeave = () => {
        if (!isScrubbing) {
            setHoverPoint(null);
            setComparePoint(null);
        }
    };

    const comparison = useMemo(() => {
        if (!hoverPoint || !comparePoint) return null;
        const diff = comparePoint.value - hoverPoint.value;
        const percent =
            hoverPoint.value === 0 ? 0 : (diff / hoverPoint.value) * 100;
        return {
            diff,
            percent,
        };
    }, [hoverPoint, comparePoint]);

    const formatDate = (timestamp: number) =>
        new Date(timestamp).toLocaleDateString("fr-FR");

    if (isLoading) {
        return <Skeleton className="h-60 w-full" />;
    }

    if (series.length === 0) {
        return (
            <div className="text-muted-foreground py-16 text-center">
                Ajoutez un ETF et vos achats pour voir &apos;l&apos;évolution.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-muted-foreground text-xs">
                        {filterLabel} {rangeLabel ? `- ${rangeLabel}` : ""}
                    </p>
                    <p className="text-lg font-semibold tabular-nums">
                        {formatCurrency(series[series.length - 1]!.value, 3)}
                    </p>
                </div>
                {hoverPoint && !comparePoint ? (
                    <div className="min-w-0 shrink text-right">
                        <p className="text-xs sm:text-sm">
                            {formatDate(hoverPoint.timestamp)}
                        </p>
                    </div>
                ) : null}
            </div>

            <div
                ref={chartRef}
                className="relative h-60 w-full touch-none"
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {hoverPoint && comparePoint && comparison ? (
                    <div className="bg-background/95 absolute top-2 right-0 left-0 z-20 mx-auto flex max-w-fit flex-col gap-1 rounded-md border px-2 py-1.5 text-xs shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                                Comparaison:
                            </span>
                            <span className="font-medium">
                                {formatDate(hoverPoint.timestamp)}
                            </span>
                            <span className="text-muted-foreground">→</span>
                            <span className="font-medium">
                                {formatDate(comparePoint.timestamp)}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 font-medium tabular-nums">
                            <span
                                className={
                                    comparison.diff >= 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                }
                            >
                                {comparison.diff >= 0 ? "+" : ""}
                                {formatCurrency(comparison.diff, 3)}
                            </span>
                            <span
                                className={
                                    comparison.percent >= 0
                                        ? "text-green-600 dark:text-green-400"
                                        : "text-red-600 dark:text-red-400"
                                }
                            >
                                ({comparison.percent >= 0 ? "+" : ""}
                                {comparison.percent.toFixed(2)}%)
                            </span>
                        </div>
                    </div>
                ) : null}
                <svg className="absolute inset-0 h-full w-full">
                    <defs>
                        <linearGradient
                            id="portfolioGradient"
                            x1="0"
                            x2="0"
                            y1="0"
                            y2="1"
                        >
                            <stop
                                offset="0%"
                                stopColor="#0f766e"
                                stopOpacity="0.4"
                            />
                            <stop
                                offset="100%"
                                stopColor="#0f766e"
                                stopOpacity="0"
                            />
                        </linearGradient>
                    </defs>
                    <path
                        d={chartPath}
                        fill="none"
                        stroke="#0f766e"
                        strokeWidth="2"
                    />
                    <path
                        d={`${chartPath} L ${chartDimensions.width} ${chartDimensions.height} L 0 ${chartDimensions.height} Z`}
                        fill="url(#portfolioGradient)"
                    />

                    {transactionMarkers.map((marker) => (
                        <g key={marker.id}>
                            <circle
                                cx={marker.x}
                                cy={marker.y}
                                r={10}
                                fill="transparent"
                                style={{ pointerEvents: "all" }}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setActiveMarkerId((prev) =>
                                        prev === marker.id ? null : marker.id
                                    );
                                }}
                            />
                            <circle
                                cx={marker.x}
                                cy={marker.y}
                                r={4}
                                fill={
                                    marker.side === "sell"
                                        ? "#f97316"
                                        : "#0f766e"
                                }
                                stroke="#ffffff"
                                strokeWidth={2}
                                style={{ pointerEvents: "none" }}
                            />
                        </g>
                    ))}

                    {hoverPoint ? (
                        <line
                            x1={hoverPoint.x}
                            x2={hoverPoint.x}
                            y1={0}
                            y2={chartDimensions.height}
                            stroke="#0f766e"
                            strokeDasharray="4 4"
                        />
                    ) : null}

                    {comparePoint ? (
                        <line
                            x1={comparePoint.x}
                            x2={comparePoint.x}
                            y1={0}
                            y2={chartDimensions.height}
                            stroke="#1f2937"
                            strokeDasharray="4 4"
                        />
                    ) : null}
                </svg>

                {hoverPoint ? (
                    <div
                        className="bg-background/90 text-foreground pointer-events-none absolute z-10 rounded-md border px-2 py-1 text-xs font-medium shadow-sm"
                        style={{
                            left: hoverPoint.x,
                            top: Math.max(4, hoverPoint.y - 24),
                            transform: "translateX(-50%)",
                        }}
                    >
                        {formatCurrency(hoverPoint.value, 3)}
                    </div>
                ) : null}

                {comparePoint ? (
                    <div
                        className="bg-background/90 text-foreground pointer-events-none absolute z-10 rounded-md border px-2 py-1 text-xs font-medium shadow-sm"
                        style={{
                            left: comparePoint.x,
                            top: Math.max(4, comparePoint.y - 24),
                            transform: "translateX(-50%)",
                        }}
                    >
                        {formatCurrency(comparePoint.value, 3)}
                    </div>
                ) : null}

                {activeMarker ? (
                    <div className="bg-background/90 absolute -top-14 right-0 rounded-md border px-3 py-2 shadow-sm">
                        <p className="text-muted-foreground text-xs">
                            {activeMarker.side === "sell" ? "Vente" : "Achat"}{" "}
                            {new Date(
                                activeMarker.timestamp
                            ).toLocaleDateString("fr-FR")}
                        </p>
                        <p className="text-center text-sm font-semibold tabular-nums">
                            {activeMarker.quantity} x{" "}
                            {formatCurrency(activeMarker.price, 3)}
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}

export { PriceChart };
