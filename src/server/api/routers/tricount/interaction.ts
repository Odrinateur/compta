import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tri_categories, tri_interactions, users } from "@/server/db/schema";
import { and, eq, getTableColumns } from "drizzle-orm";
import { getUserIfExist } from "../user";
import { hasAccess } from "./tricount";


const tricountInteractionRouter = createTRPCRouter({
    getInteractionsByTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        return await ctx.db
            .select({
                ...getTableColumns(tri_interactions),
                category: getTableColumns(tri_categories),
            })
            .from(tri_interactions)
            .innerJoin(tri_categories, eq(tri_interactions.categoryId, tri_categories.id))
            .innerJoin(users, eq(tri_interactions.userIdPayer, users.username))
            .where(eq(tri_interactions.triId, input.idTri));
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
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        await ctx.db.insert(tri_interactions).values({
            name: input.name,
            amount: input.amount,
            categoryId: input.categoryId,
            userIdPayer: input.userIdPayer,
            isRefunded: input.isRefunded,
            triId: input.idTri,
        }).returning();
    }),

    removeInteraction: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        idInteraction: z.number(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "reader");

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