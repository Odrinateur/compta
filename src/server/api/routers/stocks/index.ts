import z from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, getTableColumns } from "drizzle-orm";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { etfs, stockTransactions } from "@/server/db/schema";
import { getUserIfExist } from "../user";
import { rangeValues } from "./constants";
import { computePositionWithFees } from "@/lib/stocks/pnl";
import { fetchYahooChart, fetchYahooSearch, resolveYahooSymbol } from "./yahoo";

const stocksRouter = createTRPCRouter({
    searchSymbols: publicProcedure
        .input(z.object({ token: z.string(), query: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
            await getUserIfExist(ctx, input.token);
            const quotes = await fetchYahooSearch(input.query.trim());
            return quotes
                .filter((quote) => quote.quoteType === "ETF")
                .map((quote) => ({
                    symbol: quote.symbol,
                    label: quote.longname ?? quote.shortname ?? quote.symbol,
                    quoteType: quote.quoteType ?? "",
                }));
        }),
    getEtfs: publicProcedure
        .input(z.object({ token: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);
            return await ctx.db
                .select()
                .from(etfs)
                .where(eq(etfs.username, user.username));
        }),

    createEtf: publicProcedure
        .input(
            z.object({
                token: z.string(),
                name: z.string().min(1),
                identifier: z.string().min(1),
                annualFeePercent: z.number().min(0).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);
            const resolved = await resolveYahooSymbol(input.identifier.trim());

            const existing = await ctx.db
                .select()
                .from(etfs)
                .where(
                    and(
                        eq(etfs.username, user.username),
                        eq(etfs.yahooSymbol, resolved.symbol)
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "Cet ETF est déjà enregistré",
                });
            }

            const [created] = await ctx.db
                .insert(etfs)
                .values({
                    username: user.username,
                    name: input.name.trim(),
                    identifier: input.identifier.trim(),
                    yahooSymbol: resolved.symbol,
                    yahooName: resolved.label,
                    annualFeePercent: Number(
                        (input.annualFeePercent ?? 0).toFixed(4)
                    ),
                })
                .returning();

            if (!created) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Impossible de créer l'ETF",
                });
            }

            return created;
        }),

    deleteEtf: publicProcedure
        .input(z.object({ token: z.string(), id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);
            const etfResult = await ctx.db
                .select()
                .from(etfs)
                .where(
                    and(eq(etfs.id, input.id), eq(etfs.username, user.username))
                )
                .limit(1);

            if (etfResult.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "ETF introuvable",
                });
            }

            await ctx.db
                .delete(stockTransactions)
                .where(eq(stockTransactions.etfId, input.id));

            await ctx.db
                .delete(etfs)
                .where(
                    and(eq(etfs.id, input.id), eq(etfs.username, user.username))
                );
        }),

    createTransaction: publicProcedure
        .input(
            z.object({
                token: z.string(),
                etfId: z.number(),
                date: z.string(),
                side: z.enum(["buy", "sell"]),
                quantity: z.number().positive(),
                price: z.number().positive(),
                operationFee: z.number().min(0).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);
            const etfResult = await ctx.db
                .select(getTableColumns(etfs))
                .from(etfs)
                .where(
                    and(
                        eq(etfs.id, input.etfId),
                        eq(etfs.username, user.username)
                    )
                )
                .limit(1);

            if (etfResult.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "ETF introuvable",
                });
            }

            const [created] = await ctx.db
                .insert(stockTransactions)
                .values({
                    etfId: input.etfId,
                    username: user.username,
                    date: input.date,
                    side: input.side,
                    quantity: input.quantity,
                    price: Number(input.price.toFixed(3)),
                    operationFee: Number((input.operationFee ?? 0).toFixed(2)),
                })
                .returning();

            if (!created) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Impossible de créer la transaction",
                });
            }

            return created;
        }),

    deleteTransaction: publicProcedure
        .input(z.object({ token: z.string(), id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);
            const existing = await ctx.db
                .select()
                .from(stockTransactions)
                .where(
                    and(
                        eq(stockTransactions.id, input.id),
                        eq(stockTransactions.username, user.username)
                    )
                )
                .limit(1);

            if (existing.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Transaction introuvable",
                });
            }

            await ctx.db
                .delete(stockTransactions)
                .where(
                    and(
                        eq(stockTransactions.id, input.id),
                        eq(stockTransactions.username, user.username)
                    )
                );
        }),

    getTransactions: publicProcedure
        .input(
            z.object({
                token: z.string(),
                etfId: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);
            if (input.etfId) {
                return await ctx.db
                    .select({
                        ...getTableColumns(stockTransactions),
                        etf: getTableColumns(etfs),
                    })
                    .from(stockTransactions)
                    .leftJoin(etfs, eq(stockTransactions.etfId, etfs.id))
                    .where(
                        and(
                            eq(stockTransactions.username, user.username),
                            eq(stockTransactions.etfId, input.etfId)
                        )
                    )
                    .orderBy(desc(stockTransactions.date));
            }

            return await ctx.db
                .select({
                    ...getTableColumns(stockTransactions),
                    etf: getTableColumns(etfs),
                })
                .from(stockTransactions)
                .leftJoin(etfs, eq(stockTransactions.etfId, etfs.id))
                .where(eq(stockTransactions.username, user.username))
                .orderBy(desc(stockTransactions.date));
        }),

    getPortfolioHistory: publicProcedure
        .input(
            z.object({
                token: z.string(),
                range: z.enum(rangeValues),
                etfId: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            const selectedEtfs = await ctx.db
                .select()
                .from(etfs)
                .where(
                    input.etfId
                        ? and(
                              eq(etfs.username, user.username),
                              eq(etfs.id, input.etfId)
                          )
                        : eq(etfs.username, user.username)
                );

            if (selectedEtfs.length === 0) {
                return { series: [], transactions: [] };
            }

            if (input.etfId) {
                const etf = selectedEtfs[0];
                if (!etf) {
                    return { series: [], transactions: [] };
                }
                const cacheKey = `yahoo:${etf.yahooSymbol}:${input.range}`;
                const cached = ctx.cache.get(cacheKey) as
                    | Array<{ timestamp: number; closePrice: number }>
                    | undefined;

                const points =
                    cached ??
                    (await fetchYahooChart(etf.yahooSymbol, input.range));
                const sanitizedPoints = points.filter(
                    (point: { timestamp: number; closePrice: number }) =>
                        point.closePrice > 0
                );
                if (!cached) ctx.cache.set(cacheKey, sanitizedPoints);

                const rawTransactions = await ctx.db
                    .select({
                        ...getTableColumns(stockTransactions),
                        etf: getTableColumns(etfs),
                    })
                    .from(stockTransactions)
                    .leftJoin(etfs, eq(stockTransactions.etfId, etfs.id))
                    .where(
                        and(
                            eq(stockTransactions.username, user.username),
                            eq(stockTransactions.etfId, input.etfId)
                        )
                    );

                const transactions = rawTransactions
                    .map((transaction) => ({
                        ...transaction,
                        timestamp: new Date(transaction.date).getTime(),
                    }))
                    .sort((a, b) => a.timestamp - b.timestamp);

                return {
                    series: sanitizedPoints.map(
                        (point: { timestamp: number; closePrice: number }) => ({
                            timestamp: point.timestamp,
                            value: point.closePrice,
                        })
                    ),
                    transactions: transactions.map((transaction) => ({
                        id: transaction.id,
                        etfId: transaction.etfId,
                        etfName:
                            transaction.etf?.yahooName ??
                            transaction.etf?.name ??
                            "",
                        yahooSymbol: transaction.etf?.yahooSymbol ?? "",
                        date: transaction.date,
                        side: transaction.side,
                        quantity: transaction.quantity,
                        price: transaction.price,
                        operationFee: transaction.operationFee ?? 0,
                    })),
                };
            }

            const rawTransactions = await ctx.db
                .select({
                    ...getTableColumns(stockTransactions),
                    etf: getTableColumns(etfs),
                })
                .from(stockTransactions)
                .leftJoin(etfs, eq(stockTransactions.etfId, etfs.id))
                .where(eq(stockTransactions.username, user.username));

            const transactions = rawTransactions
                .filter((transaction) =>
                    input.etfId ? transaction.etfId === input.etfId : true
                )
                .map((transaction) => ({
                    ...transaction,
                    timestamp: new Date(transaction.date).getTime(),
                }))
                .sort((a, b) => a.timestamp - b.timestamp);

            const pricesByEtf = new Map<
                number,
                Array<{ timestamp: number; closePrice: number }>
            >();
            const timelineSet = new Set<number>();

            for (const etf of selectedEtfs) {
                const cacheKey = `yahoo:${etf.yahooSymbol}:${input.range}`;
                const cached = ctx.cache.get(cacheKey) as
                    | Array<{ timestamp: number; closePrice: number }>
                    | undefined;

                const points =
                    cached ??
                    (await fetchYahooChart(etf.yahooSymbol, input.range));
                const sanitizedPoints = points.filter(
                    (point: { timestamp: number; closePrice: number }) =>
                        point.closePrice > 0
                );
                if (!cached) ctx.cache.set(cacheKey, sanitizedPoints);

                pricesByEtf.set(etf.id, sanitizedPoints);
                sanitizedPoints.forEach(
                    (point: { timestamp: number; closePrice: number }) =>
                        timelineSet.add(point.timestamp)
                );
            }

            const timeline = Array.from(timelineSet).sort((a, b) => a - b);

            const series = timeline.map((timestamp) => ({
                timestamp,
                value: 0,
            }));

            for (const etf of selectedEtfs) {
                const prices = pricesByEtf.get(etf.id) ?? [];
                const etfTransactions = transactions.filter(
                    (transaction) => transaction.etfId === etf.id
                );
                let priceIndex = 0;
                let lastPrice: number | null = null;
                let txIndex = 0;
                let quantity = 0;

                for (let i = 0; i < timeline.length; i += 1) {
                    const timestamp = timeline[i];
                    if (timestamp === undefined) continue;

                    while (
                        priceIndex < prices.length &&
                        prices[priceIndex]!.timestamp <= timestamp
                    ) {
                        lastPrice = prices[priceIndex]!.closePrice;
                        priceIndex += 1;
                    }

                    while (
                        txIndex < etfTransactions.length &&
                        etfTransactions[txIndex]!.timestamp <= timestamp
                    ) {
                        const tx = etfTransactions[txIndex]!;
                        if (tx.side === "sell") {
                            quantity = Math.max(quantity - tx.quantity, 0);
                        } else {
                            quantity += tx.quantity;
                        }
                        txIndex += 1;
                    }

                    if (lastPrice !== null && quantity > 0) {
                        const current = series[i];
                        if (current) {
                            current.value += lastPrice * quantity;
                        }
                    }
                }
            }

            return {
                series,
                transactions: transactions.map((transaction) => ({
                    id: transaction.id,
                    etfId: transaction.etfId,
                    etfName:
                        transaction.etf?.yahooName ??
                        transaction.etf?.name ??
                        "",
                    yahooSymbol: transaction.etf?.yahooSymbol ?? "",
                    date: transaction.date,
                    side: transaction.side,
                    quantity: transaction.quantity,
                    price: transaction.price,
                    operationFee: transaction.operationFee ?? 0,
                })),
            };
        }),

    getPnlSummary: publicProcedure
        .input(z.object({ token: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);
            const transactions = await ctx.db
                .select({
                    ...getTableColumns(stockTransactions),
                    etf: getTableColumns(etfs),
                })
                .from(stockTransactions)
                .leftJoin(etfs, eq(stockTransactions.etfId, etfs.id))
                .where(eq(stockTransactions.username, user.username))
                .orderBy(stockTransactions.date);

            const groupedTransactions = new Map<number, typeof transactions>();
            for (const tx of transactions) {
                const list = groupedTransactions.get(tx.etfId) ?? [];
                list.push(tx);
                groupedTransactions.set(tx.etfId, list);
            }

            const results = [] as Array<{
                etfId: number;
                etfName: string;
                yahooSymbol: string;
                yahooName: string;
                quantity: number;
                invested: number;
                realizedPnl: number;
                currentPrice: number;
                unrealizedPnl: number;
                totalPnl: number;
            }>;

            for (const [etfId, txs] of groupedTransactions.entries()) {
                const etfMeta = txs[0]?.etf;
                const annualFeePercent = etfMeta?.annualFeePercent ?? 0;
                let currentPrice = 0;
                if (etfMeta?.yahooSymbol) {
                    const cacheKey = `yahoo:${etfMeta.yahooSymbol}:1d`;
                    const cached = ctx.cache.get(cacheKey) as
                        | Array<{ timestamp: number; closePrice: number }>
                        | undefined;
                    const points =
                        cached ??
                        (await fetchYahooChart(etfMeta.yahooSymbol, "1d"));
                    if (!cached) ctx.cache.set(cacheKey, points);
                    currentPrice = points[points.length - 1]?.closePrice ?? 0;
                }

                const position = computePositionWithFees(
                    txs.map((tx) => ({
                        date: tx.date,
                        side: tx.side as "buy" | "sell",
                        quantity: tx.quantity,
                        price: tx.price,
                        operationFee: tx.operationFee ?? 0,
                    })),
                    annualFeePercent,
                    Date.now(),
                    currentPrice
                );

                const unrealizedPnl =
                    position.quantity * currentPrice - position.invested;
                results.push({
                    etfId,
                    etfName: etfMeta?.name ?? "",
                    yahooSymbol: etfMeta?.yahooSymbol ?? "",
                    yahooName: etfMeta?.yahooName ?? "",
                    quantity: position.quantity,
                    invested: position.invested,
                    realizedPnl: position.realizedPnl,
                    currentPrice,
                    unrealizedPnl,
                    totalPnl: position.realizedPnl + unrealizedPnl,
                });
            }

            return results;
        }),
});

export default stocksRouter;
