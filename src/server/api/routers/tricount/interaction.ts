import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tri_categories, tri_interactions, tri_users, tri_users_payees, users } from "@/server/db/schema";
import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import { getUserIfExist } from "../user";
import { hasAccess } from "./tricount";
import { type TricountPayee } from "@/server/db/types";


const tricountInteractionRouter = createTRPCRouter({
    getInteractionsByTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        const interactionsRaw = await ctx.db
            .select({
                ...getTableColumns(tri_interactions),
                category: getTableColumns(tri_categories),
            })
            .from(tri_interactions)
            .innerJoin(tri_categories, eq(tri_interactions.categoryId, tri_categories.id))
            .innerJoin(users, eq(tri_interactions.userIdPayer, users.username))
            .where(eq(tri_interactions.triId, input.idTri));

        const interactionIds = interactionsRaw.map(i => i.id);
        const allPayees = interactionIds.length > 0 ? await ctx.db
            .select({
                idInteraction: tri_users_payees.idInteraction,
                userIdPayee: tri_users_payees.userIdPayee,
                amount: tri_users_payees.amount,
            })
            .from(tri_users_payees)
            .where(
                inArray(tri_users_payees.idInteraction, interactionIds)
            ) : [];

        return interactionsRaw.map((interaction) => ({
            ...interaction,
            payees: allPayees
                .filter((p) => p.idInteraction === interaction.id)
                .map((p): TricountPayee => ({
                    username: p.userIdPayee,
                    amount: p.amount,
                })),
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
        userIdPayer: z.string(),
        isRefunded: z.boolean(),
        usersPayees: z.array(z.object({
            userId: z.string(),
        })),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        const amountInCents = Math.round(input.amount * 100);

        const [newInteraction] = await ctx.db.insert(tri_interactions).values({
            name: input.name,
            amount: amountInCents,
            categoryId: input.categoryId,
            userIdPayer: input.userIdPayer,
            isRefunded: input.isRefunded,
            triId: input.idTri,
        }).returning();

        if (!newInteraction) {
            throw new Error("Failed to create interaction");
        }

        for (const userPayee of input.usersPayees) {
            await ctx.db.insert(tri_users_payees).values({
                idInteraction: newInteraction.id,
                userIdPayee: userPayee.userId,
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

        await hasAccess(ctx, user.username, input.idTri, "reader");

        await ctx.db.delete(tri_users_payees).where(eq(tri_users_payees.idInteraction, input.idInteraction));

        await ctx.db.delete(tri_interactions).where(and(eq(tri_interactions.id, input.idInteraction), eq(tri_interactions.triId, input.idTri)));
    }),

    updateInteraction: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        idInteraction: z.number(),
        name: z.string(),
        amount: z.number(),
        categoryId: z.number(),
        userIdPayer: z.string(),
        isRefunded: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
        return;
    })
});

export default tricountInteractionRouter;