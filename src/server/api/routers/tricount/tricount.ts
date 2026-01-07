import z from "zod";
import {
    createTRPCRouter,
    publicProcedure,
    type createTRPCContext,
} from "@/server/api/trpc";
import { tri, tri_users, users, tri_interactions } from "@/server/db/schema";
import { and, eq, getTableColumns, isNull, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserIfExist } from "../user";
import { type TricountInteraction, type UserLight } from "@/server/db/types";
import { createCaller } from "../../root";

const tricountRouter = createTRPCRouter({
    getTricountsByUser: publicProcedure
        .input(
            z.object({
                token: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            return await ctx.db
                .select({
                    ...getTableColumns(tri),
                })
                .from(tri)
                .leftJoin(tri_users, eq(tri.id, tri_users.idTri))
                .where(eq(tri_users.username, user.username));
        }),

    getTricountById: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            const triData = await ctx.db
                .select({
                    ...getTableColumns(tri),
                })
                .from(tri)
                .where(eq(tri.id, input.idTri))
                .limit(1);

            if (!triData || triData.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tricount not found",
                });
            }

            return triData[0];
        }),

    getTricountStats: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            const triData = await ctx.db
                .select()
                .from(tri)
                .where(eq(tri.id, input.idTri));
            if (!triData || triData.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tricount not found",
                });
            }

            const caller = createCaller(ctx);
            const interactions: TricountInteraction[] =
                await caller.tricountInteraction.getInteractionsByTricount({
                    token: input.token,
                    idTri: input.idTri,
                });

            // Filtrer les interactions non remboursées
            const activeInteractions: TricountInteraction[] =
                interactions.filter((i: TricountInteraction) => !i.isRefunded);

            // Calculs des totaux
            const totalAmount: number = activeInteractions.reduce(
                (acc: number, i: TricountInteraction) => acc + i.amount,
                0
            );
            const now = new Date();
            const totalThisMonth: number = activeInteractions
                .filter((i: TricountInteraction) => {
                    const d = new Date(i.date);
                    return (
                        d.getMonth() === now.getMonth() &&
                        d.getFullYear() === now.getFullYear()
                    );
                })
                .reduce(
                    (acc: number, i: TricountInteraction) => acc + i.amount,
                    0
                );

            // Construire la map des utilisateurs (payer + payees)
            const usersMap = new Map<string, UserLight>();
            for (const interaction of activeInteractions) {
                usersMap.set(interaction.usernamePayer, {
                    username: interaction.usernamePayer,
                });
                for (const payee of interaction.usersPayees) {
                    usersMap.set(payee.username, { username: payee.username });
                }
            }

            // Calculer les dettes brutes
            const debts: Record<string, Record<string, number>> = {};
            for (const interaction of activeInteractions) {
                const payer = interaction.usernamePayer;
                for (const payee of interaction.usersPayees) {
                    if (payee.username !== payer) {
                        debts[payee.username] ??= {};
                        debts[payee.username]![payer] =
                            (debts[payee.username]![payer] ?? 0) + payee.amount;
                    }
                }
            }

            // Simplifier les dettes (nettoie les dettes bidirectionnelles)
            const simplifiedDebts: Array<{
                debtor: UserLight;
                creditor: UserLight;
                amount: number;
            }> = [];
            const processed = new Set<string>();

            for (const debtorUsername in debts) {
                for (const creditorUsername in debts[debtorUsername]) {
                    const key = `${debtorUsername}-${creditorUsername}`;
                    if (processed.has(key)) continue;

                    const amount1 =
                        debts[debtorUsername]?.[creditorUsername] ?? 0;
                    const amount2 =
                        debts[creditorUsername]?.[debtorUsername] ?? 0;
                    const netAmount = amount1 - amount2;

                    const debtor = usersMap.get(debtorUsername);
                    const creditor = usersMap.get(creditorUsername);
                    if (!debtor || !creditor) continue;

                    if (netAmount > 0) {
                        simplifiedDebts.push({
                            debtor,
                            creditor,
                            amount: netAmount,
                        });
                    } else if (netAmount < 0) {
                        simplifiedDebts.push({
                            debtor: creditor,
                            creditor: debtor,
                            amount: -netAmount,
                        });
                    }

                    processed.add(key);
                    processed.add(`${creditorUsername}-${debtorUsername}`);
                }
            }

            return {
                ...triData[0],
                totalAmount,
                totalThisMonth,
                debts: simplifiedDebts,
            };
        }),

    createTricount: publicProcedure
        .input(
            z.object({
                token: z.string(),
                name: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            const triData = await ctx.db
                .insert(tri)
                .values({ name: input.name })
                .returning();

            await ctx.db
                .insert(tri_users)
                .values({ username: user.username, idTri: triData[0]!.id })
                .returning();

            return triData[0]!.id;
        }),

    updateTricount: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
                name: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            await ctx.db
                .update(tri)
                .set({ name: input.name })
                .where(eq(tri.id, input.idTri));
        }),

    markDebtAsRefunded: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
                debtorUsername: z.string(),
                creditorUsername: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            // Récupérer toutes les interactions actives du tricount
            const caller = createCaller(ctx);
            const interactions: TricountInteraction[] =
                await caller.tricountInteraction.getInteractionsByTricount({
                    token: input.token,
                    idTri: input.idTri,
                });

            // Filtrer les interactions non remboursées où le creditor est le payer
            // et le debtor est dans les payees
            const interactionsToRefund = interactions.filter(
                (interaction) =>
                    !interaction.isRefunded &&
                    interaction.usernamePayer === input.creditorUsername &&
                    interaction.usersPayees.some(
                        (payee) => payee.username === input.debtorUsername
                    )
            );

            // Marquer toutes ces interactions comme remboursées
            if (interactionsToRefund.length > 0) {
                const interactionIds = interactionsToRefund.map((i) => i.id);
                await ctx.db
                    .update(tri_interactions)
                    .set({ isRefunded: true })
                    .where(
                        and(
                            eq(tri_interactions.triId, input.idTri),
                            inArray(tri_interactions.id, interactionIds)
                        )
                    );
            }
        }),

    addUserToTricount: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
                username: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            const triData = await ctx.db
                .select()
                .from(tri)
                .where(eq(tri.id, input.idTri));
            if (!triData || triData.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Tricount not found",
                });
            }

            await ctx.db
                .insert(tri_users)
                .values({ username: input.username, idTri: triData[0]!.id });
        }),

    removeUserFromTricount: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
                username: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            await ctx.db
                .delete(tri_users)
                .where(
                    and(
                        eq(tri_users.username, input.username),
                        eq(tri_users.idTri, input.idTri)
                    )
                );
        }),

    getUsersInTricount: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            const usersInTricount = await ctx.db
                .select({
                    username: users.username,
                })
                .from(tri_users)
                .innerJoin(users, eq(tri_users.username, users.username))
                .where(eq(tri_users.idTri, input.idTri));

            return usersInTricount;
        }),

    getUsersNotInTricount: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            return await ctx.db
                .select({ users: users.username })
                .from(users)
                .leftJoin(
                    tri_users,
                    and(
                        eq(tri_users.username, users.username),
                        eq(tri_users.idTri, input.idTri)
                    )
                )
                .where(isNull(tri_users.username));
        }),
});

const hasAccess = async (
    ctx: Awaited<ReturnType<typeof createTRPCContext>>,
    username: string,
    idTri: number
) => {
    const cachedUserAccess = ctx.cache.get(
        `tricount-access-${username}-${idTri}`
    );
    if (cachedUserAccess) {
        return cachedUserAccess as boolean;
    }

    const userAccess = await ctx.db
        .select()
        .from(tri_users)
        .where(
            and(eq(tri_users.username, username), eq(tri_users.idTri, idTri))
        )
        .limit(1);

    if (!userAccess || userAccess.length === 0) {
        throw new TRPCError({
            code: "NOT_FOUND",
            message: "Tricount not found",
        });
    }

    ctx.cache.set(`tricount-access-${username}-${idTri}`, true);
};

export default tricountRouter;
export { hasAccess };
