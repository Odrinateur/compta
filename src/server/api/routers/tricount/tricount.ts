import z from "zod";
import { createTRPCRouter, publicProcedure, type createTRPCContext } from "@/server/api/trpc";
import { tri, tri_users, users } from "@/server/db/schema";
import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserIfExist } from "../user";
import { roleHierarchy, type RoleWithAny, type TricountInteraction, type User } from "@/server/db/types";
import { createCaller } from "../../root";
import { uint8ArrayToBase64 } from "@/lib/utils";


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
            .where(eq(tri_users.username, user.username));
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

        // Calculs des totaux
        const totalAmount: number = activeInteractions.reduce((acc: number, i: TricountInteraction) => acc + i.amount, 0);
        const now = new Date();
        const totalThisMonth: number = activeInteractions
            .filter((i: TricountInteraction) => {
                const d = new Date(i.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            })
            .reduce((acc: number, i: TricountInteraction) => acc + i.amount, 0);

        // Construire la map des utilisateurs (payer + payees)
        const usersMap = new Map<string, User>();
        for (const interaction of activeInteractions) {
            usersMap.set(interaction.userPayer.username, interaction.userPayer);
            for (const payee of interaction.usersPayees) {
                usersMap.set(payee.username, payee);
            }
        }

        // Calculer les dettes brutes
        const debts: Record<string, Record<string, number>> = {};
        for (const interaction of activeInteractions) {
            const payer = interaction.userPayer.username;
            for (const payee of interaction.usersPayees) {
                if (payee.username !== payer) {
                    debts[payee.username] ??= {};
                    debts[payee.username]![payer] = (debts[payee.username]![payer] ?? 0) + payee.amount;
                }
            }
        }

        // Simplifier les dettes (nettoie les dettes bidirectionnelles)
        const simplifiedDebts: Array<{ debtor: User; creditor: User; amount: number }> = [];
        const processed = new Set<string>();

        for (const debtorUsername in debts) {
            for (const creditorUsername in debts[debtorUsername]) {
                const key = `${debtorUsername}-${creditorUsername}`;
                if (processed.has(key)) continue;

                const amount1 = debts[debtorUsername]?.[creditorUsername] ?? 0;
                const amount2 = debts[creditorUsername]?.[debtorUsername] ?? 0;
                const netAmount = amount1 - amount2;

                const debtor = usersMap.get(debtorUsername);
                const creditor = usersMap.get(creditorUsername);
                if (!debtor || !creditor) continue;

                if (netAmount > 0) {
                    simplifiedDebts.push({ debtor, creditor, amount: netAmount });
                } else if (netAmount < 0) {
                    simplifiedDebts.push({ debtor: creditor, creditor: debtor, amount: -netAmount });
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

    createTricount: publicProcedure.input(z.object({
        token: z.string(),
        name: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        const triData = await ctx.db.insert(tri).values({ name: input.name }).returning();

        await ctx.db.insert(tri_users).values({ username: user.username, idTri: triData[0]!.id, role: "owner" }).returning();

        return triData[0]!.id;
    }),

    updateTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        name: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "owner");

        await ctx.db.update(tri).set({ name: input.name }).where(eq(tri.id, input.idTri));
    }),

    addUserToTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        username: z.string(),
        role: z.enum(["writer", "reader"]),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "owner");

        const triData = await ctx.db.select().from(tri).where(eq(tri.id, input.idTri));
        if (!triData || triData.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
        }

        await ctx.db.insert(tri_users).values({ username: input.username, idTri: triData[0]!.id, role: input.role });
    }),

    removeUserFromTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        username: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "owner");

        await ctx.db.delete(tri_users).where(and(eq(tri_users.username, input.username), eq(tri_users.idTri, input.idTri)));
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
                picture: users.picture,
                type: users.type,
            })
            .from(tri_users)
            .innerJoin(users, eq(tri_users.username, users.username))
            .where(eq(tri_users.idTri, input.idTri));

        return usersInTricount.map(u => ({
            username: u.username,
            picture: u.picture ? uint8ArrayToBase64(u.picture as Uint8Array) : null,
            type: u.type,
        }));
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
            .leftJoin(tri_users, and(eq(tri_users.username, users.username), eq(tri_users.idTri, input.idTri)))
            .where(isNull(tri_users.username));
    }),
});


const hasAccess = async (ctx: Awaited<ReturnType<typeof createTRPCContext>>, username: string, idTri: number, checkRole: RoleWithAny = "any") => {
    const userAccess = await ctx.db
        .select()
        .from(tri_users)
        .where(and(eq(tri_users.username, username), eq(tri_users.idTri, idTri)))
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