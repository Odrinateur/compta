import z from "zod";
import { createTRPCRouter, publicProcedure, type createTRPCContext } from "@/server/api/trpc";
import { countCategories, countEveryMonthInteractions, countInteractions, countMonths, tokens } from "@/server/db/schema";
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
                ...getTableColumns(countInteractions),
                category: getTableColumns(countCategories),
            })
            .from(countInteractions)
            .leftJoin(countCategories, eq(countInteractions.categoryId, countCategories.id))
            .where(and(eq(countInteractions.monthId, month.id), eq(countInteractions.userId, user[0]!.username)));

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

        return await ctx.db.select().from(countCategories);
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

        const month = await ctx.db.select().from(countMonths).where(eq(countMonths.id, input.monthId));
        if (!month || month.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Month not found" });
        }

    }),
});

export const getMonthByDate = async (ctx: Awaited<ReturnType<typeof createTRPCContext>>, userId: string, date: Date, withCreate = true) => {
    const month = await ctx.db.select().from(countMonths).where(and(eq(countMonths.year, date.getFullYear()), eq(countMonths.month, date.getMonth() + 1)));

    if (!month || month.length === 0 && withCreate) {
        return await createNewMonth(ctx, userId, date);
    }

    return month[0]!;
}

const createNewMonth = async (ctx: Awaited<ReturnType<typeof createTRPCContext>>, userId: string, date: Date) => {
    const month = await ctx.db.insert(countMonths).values({ year: date.getFullYear(), month: date.getMonth() + 1 }).returning();

    const defaultInteractions = await ctx.db
        .select(
            getTableColumns(countInteractions),
        )
        .from(countInteractions)
        .innerJoin(countEveryMonthInteractions, eq(countInteractions.id, countEveryMonthInteractions.idInteraction))
        .where(and(eq(countEveryMonthInteractions.isActive, true), eq(countInteractions.userId, userId)));

    for (const interaction of defaultInteractions) {
        await ctx.db.insert(countInteractions).values({
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