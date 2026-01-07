import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tri_categories, tri_interactions, tri_users_payees } from "@/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { getUserIfExist } from "../user";
import { hasAccess } from "./tricount";

const tricountInteractionRouter = createTRPCRouter({
    getInteractionsByTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        // Requête sans JOIN sur users - on ne récupère plus les pictures
        const rows = await ctx.db
            .select({
                id: tri_interactions.id,
                name: tri_interactions.name,
                amount: tri_interactions.amount,
                categoryId: tri_interactions.categoryId,
                triId: tri_interactions.triId,
                isRefunded: tri_interactions.isRefunded,
                date: tri_interactions.date,
                usernamePayer: tri_interactions.usernamePayer,
                categoryName: tri_categories.name,
            })
            .from(tri_interactions)
            .innerJoin(
                tri_categories,
                eq(tri_interactions.categoryId, tri_categories.id),
            )
            .where(eq(tri_interactions.triId, input.idTri));

        if (rows.length === 0) {
            return [];
        }

        // Récupérer les payees sans les pictures
        const allPayees = await ctx.db
            .select({
                idInteraction: tri_users_payees.idInteraction,
                usernamePayee: tri_users_payees.usernamePayee,
                amount: tri_users_payees.amount,
            })
            .from(tri_users_payees)
            .where(
                inArray(
                    tri_users_payees.idInteraction,
                    rows.map((r) => r.id),
                ),
            );

        // Map pour association O(1)
        const payeesMap = new Map<
            number,
            { username: string; amount: number }[]
        >();
        for (const p of allPayees) {
            const payee = {
                username: p.usernamePayee,
                amount: p.amount,
            };
            const existing = payeesMap.get(p.idInteraction);
            if (existing) {
                existing.push(payee);
            } else {
                payeesMap.set(p.idInteraction, [payee]);
            }
        }

        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            amount: row.amount,
            categoryId: row.categoryId,
            triId: row.triId,
            isRefunded: row.isRefunded,
            date: row.date,
            category: {
                id: row.categoryId,
                name: row.categoryName,
            },
            usernamePayer: row.usernamePayer,
            usersPayees: payeesMap.get(row.id) ?? [],
        }));
    }),

    getCategoriesByTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        return await ctx.db.select().from(tri_categories);
    }),

    createInteraction: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        name: z.string(),
        amount: z.number(),
        categoryId: z.number(),
        usernamePayer: z.string(),
        isRefunded: z.boolean(),
        usersPayees: z.array(z.object({
            username: z.string(),
        })),
        date: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        const amountInCents = Math.round(input.amount * 100);

        const [newInteraction] = await ctx.db.insert(tri_interactions).values({
            name: input.name,
            amount: amountInCents,
            categoryId: input.categoryId,
            usernamePayer: input.usernamePayer,
            isRefunded: input.isRefunded,
            triId: input.idTri,
            date: input.date,
        }).returning();

        if (!newInteraction) {
            throw new Error("Failed to create interaction");
        }

        for (const userPayee of input.usersPayees) {
            await ctx.db.insert(tri_users_payees).values({
                idInteraction: newInteraction.id,
                usernamePayee: userPayee.username,
                amount: Math.round(amountInCents / input.usersPayees.length),
            });
        }

        return newInteraction;
    }),

    removeInteraction: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        idInteraction: z.number(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        await ctx.db.delete(tri_users_payees).where(eq(tri_users_payees.idInteraction, input.idInteraction));

        await ctx.db.delete(tri_interactions).where(and(eq(tri_interactions.id, input.idInteraction), eq(tri_interactions.triId, input.idTri)));
    }),

    setInteractionRefunded: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
                idInteraction: z.number(),
                isRefunded: z.boolean(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            await ctx.db
                .update(tri_interactions)
                .set({ isRefunded: input.isRefunded })
                .where(
                    and(
                        eq(tri_interactions.id, input.idInteraction),
                        eq(tri_interactions.triId, input.idTri),
                    ),
                );
        }),

    updateInteraction: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
                idInteraction: z.number(),
                name: z.string(),
                amount: z.number(),
                categoryId: z.number(),
                usernamePayer: z.string(),
                isRefunded: z.boolean(),
                usersPayees: z.array(
                    z.object({
                        username: z.string(),
                    }),
                ),
                date: z.string(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            const amountInCents = Math.round(input.amount * 100);

            await ctx.db
                .update(tri_interactions)
                .set({
                    name: input.name,
                    amount: amountInCents,
                    categoryId: input.categoryId,
                    usernamePayer: input.usernamePayer,
                    isRefunded: input.isRefunded,
                    date: input.date,
                })
                .where(
                    and(
                        eq(tri_interactions.id, input.idInteraction),
                        eq(tri_interactions.triId, input.idTri),
                    ),
                );

            // Supprimer les anciens payees et les recréer
            await ctx.db
                .delete(tri_users_payees)
                .where(eq(tri_users_payees.idInteraction, input.idInteraction));

            for (const userPayee of input.usersPayees) {
                await ctx.db.insert(tri_users_payees).values({
                    idInteraction: input.idInteraction,
                    usernamePayee: userPayee.username,
                    amount: Math.round(amountInCents / input.usersPayees.length),
                });
            }
        }),
});

export default tricountInteractionRouter;