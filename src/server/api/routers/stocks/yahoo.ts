import { TRPCError } from "@trpc/server";
import { type RangeValue, rangeToInterval, rangeToYahoo } from "./constants";

interface YahooSearchQuote {
    symbol: string;
    shortname?: string;
    longname?: string;
    quoteType?: string;
}

interface YahooChartResponse {
    chart?: {
        result?: Array<{
            timestamp?: number[];
            indicators?: {
                quote?: Array<{
                    close?: Array<number | null>;
                }>;
            };
        }>;
    };
}

const fetchYahooSearch = async (query: string) => {
    const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
    url.searchParams.set("q", query);
    url.searchParams.set("quotesCount", "8");
    url.searchParams.set("newsCount", "0");

    const response = await fetch(url.toString(), {
        headers: {
            Accept: "application/json",
            "User-Agent": "compta-app",
        },
    });

    if (!response.ok) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Impossible de rechercher le symbole Yahoo",
        });
    }

    console.log(response);

    const json: { quotes: Array<YahooSearchQuote> } = await response.json();

    return json.quotes ?? [];
};

const resolveYahooSymbol = async (identifier: string) => {
    const quotes = await fetchYahooSearch(identifier);
    if (quotes.length === 0) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Aucun ETF trouvé pour cet identifiant",
        });
    }

    const etfQuote = quotes.find((quote) => quote.quoteType === "ETF");
    const pick = etfQuote ?? quotes[0];

    if (!pick?.symbol) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Impossible de déterminer le symbole Yahoo",
        });
    }

    return {
        symbol: pick.symbol,
        label: pick.longname ?? pick.shortname ?? pick.symbol,
    };
};

const fetchYahooChart = async (
    symbol: string,
    range: RangeValue
): Promise<Array<{ timestamp: number; closePrice: number }>> => {
    const url = new URL(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
            symbol
        )}`
    );
    url.searchParams.set("range", rangeToYahoo[range]);
    url.searchParams.set("interval", rangeToInterval[range]);
    url.searchParams.set("includePrePost", "false");

    const response = await fetch(url.toString(), {
        headers: {
            Accept: "application/json",
            "User-Agent": "compta-app",
        },
    });

    if (!response.ok) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Impossible de récupérer l'historique Yahoo",
        });
    }

    const json = (await response.json()) as YahooChartResponse;

    const result = json.chart?.result?.[0];
    if (!result?.timestamp || !result.indicators?.quote?.[0]) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Historique indisponible pour cet ETF",
        });
    }

    const closes = result.indicators.quote[0].close ?? [];

    const points = result.timestamp
        .map((timestamp: number, index: number) => {
            const close = closes[index];
            if (close === null || close === undefined || close <= 0) {
                return null;
            }

            return {
                timestamp: timestamp * 1000,
                closePrice: Number(close.toFixed(3)),
            };
        })
        .filter(
            (
                point: { timestamp: number; closePrice: number } | null
            ): point is { timestamp: number; closePrice: number } =>
                Boolean(point)
        );

    const cleanedPoints = points.filter((point, index) => {
        const window: number[] = [];
        for (let offset = -2; offset <= 2; offset += 1) {
            if (offset === 0) continue;
            const neighbor = points[index + offset];
            if (neighbor) window.push(neighbor.closePrice);
        }
        if (window.length < 3) return true;
        window.sort((a, b) => a - b);
        const median = window[Math.floor(window.length / 2)]!;
        if (point.closePrice < median * 0.7) return false;
        if (point.closePrice > median * 1.3) return false;
        return true;
    });

    if (cleanedPoints.length === 0) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Historique vide pour cet ETF",
        });
    }

    return cleanedPoints;
};

export { fetchYahooChart, fetchYahooSearch, resolveYahooSymbol };
