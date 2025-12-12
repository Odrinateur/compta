import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const userRouter = createTRPCRouter({
    createUser: publicProcedure.mutation(async ({ ctx }) => {
        const userResult = await ctx.db.insert(users).values({}).returning();

        return {
            id: userResult[0]!.id,
        };
    }),
    getUser: publicProcedure.input(z.object({
        userId: z.number(),
    })).query(async ({ ctx, input }) => {
        const userResult = await ctx.db.select().from(users).where(eq(users.id, input.userId));

        if (!userResult || userResult.length === 0) {
            throw new Error("User not found");
        }

        return {
            id: userResult[0]!.id,
        };
    }),
});

export default userRouter;