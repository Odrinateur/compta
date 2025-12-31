import z from "zod";
import { createTRPCRouter, publicProcedure, type createTRPCContext } from "@/server/api/trpc";
import { categories, everyMonthInteractions, interactions, months, tokens } from "@/server/db/schema";
import { eq, and, getTableColumns } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const monthRouter = createTRPCRouter({
    getCurrentMonth: publicProcedure.input(z.object({
        token: z.string(),
    })).query(async ({ ctx, input }) => {
        const user = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));
        if (!user || user.length === 0) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        const date = new Date();
        const month = await getMonthByDate(ctx, user[0]!.username, date);

        const lastMonthDate = new Date(date.getFullYear(), date.getMonth() - 1, 1);
        const previousMonth = await getMonthByDate(ctx, user[0]!.username, lastMonthDate, false);

        const nextMonthDate = new Date(date.getFullYear(), date.getMonth() + 1, 1);
        const nextMonth = await getMonthByDate(ctx, user[0]!.username, nextMonthDate, false);

        const monthInteractions = await ctx.db
            .select({
                ...getTableColumns(interactions),
                category: getTableColumns(categories),
            })
            .from(interactions)
            .leftJoin(categories, eq(interactions.categoryId, categories.id))
            .where(and(eq(interactions.monthId, month.id), eq(interactions.userId, user[0]!.username)));

        return {
            month: month,
            previousMonthId: previousMonth?.id ?? null,
            nextMonthId: nextMonth?.id ?? null,
            interactions: monthInteractions,
        }

    }),
    getCategories: publicProcedure.input(z.object({
        token: z.string(),
    })).query(async ({ ctx, input }) => {
        const user = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));
        if (!user || user.length === 0) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        return await ctx.db.select().from(categories);
    }),
    addInteraction: publicProcedure.input(z.object({
        token: z.string(),
        monthId: z.number(),
        name: z.string(),
        categoryId: z.number(),
        amount: z.number(),
    })).mutation(async ({ ctx, input }) => {
        const user = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));
        if (!user || user.length === 0) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        const month = await ctx.db.select().from(months).where(eq(months.id, input.monthId));
        if (!month || month.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Month not found" });
        }

    }),
});

export const getMonthByDate = async (ctx: Awaited<ReturnType<typeof createTRPCContext>>, userId: string, date: Date, withCreate = true) => {
    const month = await ctx.db.select().from(months).where(and(eq(months.year, date.getFullYear()), eq(months.month, date.getMonth())));

    if (!month || month.length === 0 && withCreate) {
        return await createNewMonth(ctx, userId, date);
    }

    return month[0]!;
}

const createNewMonth = async (ctx: Awaited<ReturnType<typeof createTRPCContext>>, userId: string, date: Date) => {
    const month = await ctx.db.insert(months).values({ year: date.getFullYear(), month: date.getMonth() }).returning();

    const defaultInteractions = await ctx.db
        .select(
            getTableColumns(interactions),
        )
        .from(interactions)
        .innerJoin(everyMonthInteractions, eq(interactions.id, everyMonthInteractions.idInteraction))
        .where(and(eq(everyMonthInteractions.isActive, true), eq(interactions.userId, userId)));

    for (const interaction of defaultInteractions) {
        await ctx.db.insert(interactions).values({
            name: interaction.name,
            categoryId: interaction.categoryId,
            amount: interaction.amount,
            monthId: month[0]!.id,
            userId: userId,
        });
    }

    return month[0]!;
};

export default monthRouter;