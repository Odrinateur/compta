import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { countCategories, countInteractions } from "@/server/db/schema";
import { eq, and, getTableColumns } from "drizzle-orm";
import { getUserIfExist } from "../user";

const interactionRouter = createTRPCRouter({
    getMonthInteractions: publicProcedure
        .input(
            z.object({
                token: z.string(),
                monthId: z.number(),
                username: z.string(),
                default: z.boolean().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            await getUserIfExist(ctx, input.token);

            return await ctx.db
                .select({
                    ...getTableColumns(countInteractions),
                    category: getTableColumns(countCategories),
                })
                .from(countInteractions)
                .leftJoin(
                    countCategories,
                    eq(countInteractions.categoryId, countCategories.id)
                )
                .where(
                    and(
                        eq(countInteractions.monthId, input.monthId),
                        eq(countInteractions.username, input.username),
                        eq(countInteractions.isDefault, input.default ?? false)
                    )
                );
        }),

    getCategories: publicProcedure
        .input(
            z.object({
                token: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            await getUserIfExist(ctx, input.token);

            return await ctx.db.select().from(countCategories);
        }),

    createInteraction: publicProcedure
        .input(
            z.object({
                token: z.string(),
                monthId: z.number(),
                username: z.string(),
                name: z.string(),
                categoryId: z.number(),
                amount: z.number(),
                isDefault: z.boolean().optional(),
                oldInteractionId: z.number().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await getUserIfExist(ctx, input.token);

            if (input.isDefault && input.oldInteractionId) {
                await ctx.db.insert(countInteractions).values({
                    name: input.name,
                    categoryId: input.categoryId,
                    amount: input.amount * 100,
                    monthId: 0,
                    username: input.username,
                    isDefault: true,
                });

                await ctx.db
                    .delete(countInteractions)
                    .where(
                        and(
                            eq(countInteractions.monthId, input.monthId),
                            eq(countInteractions.username, input.username),
                            eq(countInteractions.isDefault, false),
                            eq(countInteractions.id, input.oldInteractionId)
                        )
                    );
            }

            const [newInteraction] = await ctx.db
                .insert(countInteractions)
                .values({
                    name: input.name,
                    categoryId: input.categoryId,
                    amount: input.amount * 100,
                    monthId: input.monthId,
                    username: input.username,
                    isDefault: input.isDefault ?? false,
                })
                .returning();

            if (!newInteraction) {
                throw new Error("Failed to create interaction");
            }

            return newInteraction;
        }),

    updateInteraction: publicProcedure
        .input(
            z.object({
                token: z.string(),
                monthId: z.number(),
                username: z.string(),
                idInteraction: z.number(),
                name: z.string(),
                categoryId: z.number(),
                amount: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await getUserIfExist(ctx, input.token);

            await ctx.db
                .update(countInteractions)
                .set({
                    name: input.name,
                    categoryId: input.categoryId,
                    amount: input.amount * 100,
                })
                .where(eq(countInteractions.id, input.idInteraction));
        }),

    removeInteraction: publicProcedure
        .input(
            z.object({
                token: z.string(),
                monthId: z.number(),
                username: z.string(),
                idInteraction: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await getUserIfExist(ctx, input.token);

            await ctx.db
                .delete(countInteractions)
                .where(eq(countInteractions.id, input.idInteraction));
        }),
});

export default interactionRouter;
