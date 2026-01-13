import z from "zod";
import {
    createTRPCRouter,
    publicProcedure,
    type createTRPCContext,
} from "@/server/api/trpc";
import {
    countCategories,
    countInteractions,
    countMonths,
} from "@/server/db/schema";
import { eq, and, getTableColumns, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserIfExist } from "../user";

const countMonthRouter = createTRPCRouter({
    getCurrentMonth: publicProcedure
        .input(
            z.object({
                token: z.string(),
                monthId: z.number().optional(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            let month;
            if (input.monthId) {
                const result = await ctx.db
                    .select()
                    .from(countMonths)
                    .where(eq(countMonths.id, input.monthId));

                if (!result || result.length === 0) {
                    throw new TRPCError({
                        code: "NOT_FOUND",
                        message: "Month not found",
                    });
                }

                month = result[0]!;
            } else {
                const date = new Date();
                month = await getMonthByDate(ctx, user.username, date);
            }

            const lastMonthDate = new Date(month.year, month.month - 2, 1);
            const previousMonth = await getMonthByDate(
                ctx,
                user.username,
                lastMonthDate,
                false
            );

            const nextMonthDate = new Date(month.year, month.month, 1);
            const nextMonth = await getMonthByDate(
                ctx,
                user.username,
                nextMonthDate,
                false
            );

            return {
                month: month,
                previousMonthId: previousMonth?.id ?? null,
                nextMonthId: nextMonth?.id ?? null,
            };
        }),

    getTotalAmount: publicProcedure
        .input(
            z.object({
                token: z.string(),
                monthId: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            await getUserIfExist(ctx, input.token);

            const result = await ctx.db
                .select({
                    totalAmount: sql<number>`COALESCE(SUM(${countInteractions.amount}), 0)`,
                })
                .from(countInteractions)
                .where(eq(countInteractions.monthId, input.monthId));

            return result[0]?.totalAmount ?? 0;
        }),

    createMonth: publicProcedure
        .input(
            z.object({
                token: z.string(),
                username: z.string(),
                year: z.number(),
                month: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await getUserIfExist(ctx, input.token);

            const date = new Date(input.year, input.month - 1, 1);

            return await getMonthByDate(ctx, input.username, date);
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

    addInteraction: publicProcedure
        .input(
            z.object({
                token: z.string(),
                monthId: z.number(),
                name: z.string(),
                categoryId: z.number(),
                amount: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            await getUserIfExist(ctx, input.token);

            const month = await ctx.db
                .select()
                .from(countMonths)
                .where(eq(countMonths.id, input.monthId));
            if (!month || month.length === 0) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Month not found",
                });
            }
        }),
});

const getMonthByDate = async (
    ctx: Awaited<ReturnType<typeof createTRPCContext>>,
    username: string,
    date: Date,
    withCreate = true
) => {
    const month = await ctx.db
        .select()
        .from(countMonths)
        .where(
            and(
                eq(countMonths.year, date.getFullYear()),
                eq(countMonths.month, date.getMonth() + 1)
            )
        );

    if (!month || (month.length === 0 && withCreate)) {
        return await createNewMonth(ctx, username, date);
    }

    return month[0]!;
};

const createNewMonth = async (
    ctx: Awaited<ReturnType<typeof createTRPCContext>>,
    username: string,
    date: Date
) => {
    const month = await ctx.db
        .insert(countMonths)
        .values({ year: date.getFullYear(), month: date.getMonth() + 1 })
        .returning();

    const defaultInteractions = await ctx.db
        .select(getTableColumns(countInteractions))
        .from(countInteractions)
        .where(
            and(
                and(
                    eq(countInteractions.isDefault, true),
                    eq(countInteractions.username, username),
                    eq(countInteractions.monthId, 0)
                )
            )
        );

    for (const interaction of defaultInteractions) {
        await ctx.db.insert(countInteractions).values({
            name: interaction.name,
            categoryId: interaction.categoryId,
            amount: interaction.amount,
            monthId: month[0]!.id,
            username: username,
            isDefault: true,
        });
    }

    return month[0]!;
};

export default countMonthRouter;
