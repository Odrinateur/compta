import z from "zod";
import { createTRPCRouter, publicProcedure, type createTRPCContext } from "@/server/api/trpc";
import { tri, tri_users, users } from "@/server/db/schema";
import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserIfExist } from "../user";
import { roleHierarchy, type RoleWithAny, type TricountInteraction } from "@/server/db/types";
import { createCaller } from "../../root";


const tricountRouter = createTRPCRouter({
    getTricountsByUser: publicProcedure.input(z.object({
        token: z.string(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        return await ctx.db
            .select({
                ...getTableColumns(tri)
            })
            .from(tri)
            .leftJoin(tri_users, eq(tri.id, tri_users.idTri))
            .where(eq(tri_users.userId, user.username));
    }),

    getTricountById: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
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
            throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
        }

        return triData[0];
    }),

    getTricountStats: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        const triData = await ctx.db.select().from(tri).where(eq(tri.id, input.idTri));
        if (!triData || triData.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
        }

        const caller = createCaller(ctx);
        const interactions: TricountInteraction[] = await caller.tricountInteraction.getInteractionsByTricount({ token: input.token, idTri: input.idTri });

        // Filtrer les interactions non remboursées
        const activeInteractions: TricountInteraction[] = interactions.filter((i: TricountInteraction) => !i.isRefunded);

        // Calculer le total global
        const totalAmount: number = activeInteractions.reduce((acc: number, interaction: TricountInteraction) => acc + interaction.amount, 0);

        // Calculer le total du mois en cours
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const interactionsThisMonth: TricountInteraction[] = activeInteractions.filter((interaction: TricountInteraction) => {
            const interactionDate = new Date(interaction.date);
            return interactionDate.getMonth() === currentMonth && interactionDate.getFullYear() === currentYear;
        });
        const totalThisMonth: number = interactionsThisMonth.reduce((acc: number, interaction: TricountInteraction) => acc + interaction.amount, 0);

        // Calculer les dettes entre personnes
        // Structure: { [debtor]: { [creditor]: amount } }
        const debts: Record<string, Record<string, number>> = {};

        for (const interaction of activeInteractions) {
            const payer = interaction.userIdPayer;

            for (const payee of interaction.payees) {
                const debtor = payee.username;
                const amount = payee.amount;

                if (debtor !== payer) {
                    debts[debtor] ??= {};
                    debts[debtor][payer] = (debts[debtor][payer] ?? 0) + amount;
                }
            }
        }

        // Simplifier les dettes (si A doit à B et B doit à A, on nettoie)
        const simplifiedDebts: Array<{ debtor: string; creditor: string; amount: number }> = [];
        const processed = new Set<string>();

        for (const debtor in debts) {
            for (const creditor in debts[debtor]) {
                const key1 = `${debtor}-${creditor}`;
                const key2 = `${creditor}-${debtor}`;

                if (processed.has(key1) || processed.has(key2)) {
                    continue;
                }

                const amount1 = debts[debtor]?.[creditor] ?? 0;
                const amount2 = debts[creditor]?.[debtor] ?? 0;

                if (amount1 > amount2) {
                    simplifiedDebts.push({
                        debtor,
                        creditor,
                        amount: amount1 - amount2,
                    });
                } else if (amount2 > amount1) {
                    simplifiedDebts.push({
                        debtor: creditor,
                        creditor: debtor,
                        amount: amount2 - amount1,
                    });
                }

                processed.add(key1);
                processed.add(key2);
            }
        }

        return {
            ...triData[0]!,
            totalAmount,
            totalThisMonth,
            debts: simplifiedDebts,
        };
    }),

    createTricount: publicProcedure.input(z.object({
        token: z.string(),
        name: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        const triData = await ctx.db.insert(tri).values({ name: input.name }).returning();

        await ctx.db.insert(tri_users).values({ userId: user.username, idTri: triData[0]!.id, role: "owner" }).returning();

        return triData[0]!.id;
    }),

    addUserToTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        userId: z.string(),
        role: z.enum(["writer", "reader"]),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "owner");

        const triData = await ctx.db.select().from(tri).where(eq(tri.id, input.idTri));
        if (!triData || triData.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
        }

        await ctx.db.insert(tri_users).values({ userId: input.userId, idTri: triData[0]!.id, role: input.role });
    }),

    removeUserFromTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        userId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "owner");

        await ctx.db.delete(tri_users).where(and(eq(tri_users.userId, input.userId), eq(tri_users.idTri, input.idTri)));
    }),

    getUsersInTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        const usersInTricount = await ctx.db
            .select({
                username: users.username,
            })
            .from(tri_users)
            .innerJoin(users, eq(tri_users.userId, users.username))
            .where(eq(tri_users.idTri, input.idTri));

        return usersInTricount.map(u => u.username);
    }),

    getUsersNotInTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "owner");

        return await ctx.db
            .select({ users: users.username })
            .from(users)
            .leftJoin(tri_users, and(eq(tri_users.userId, users.username), eq(tri_users.idTri, input.idTri)))
            .where(isNull(tri_users.userId));
    }),
});


const hasAccess = async (ctx: Awaited<ReturnType<typeof createTRPCContext>>, username: string, idTri: number, checkRole: RoleWithAny = "any") => {
    const userAccess = await ctx.db
        .select()
        .from(tri_users)
        .where(and(eq(tri_users.userId, username), eq(tri_users.idTri, idTri)))
        .limit(1);

    if (!userAccess || userAccess.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
    }

    if (checkRole === "any") {
        return;
    }

    const userRole = userAccess[0]!.role;
    if (roleHierarchy[userRole] < roleHierarchy[checkRole]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
    }
}

export default tricountRouter;
export { hasAccess };