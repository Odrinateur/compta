import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tokens, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateToken } from "@/lib/token";

const userRouter = createTRPCRouter({
    createUser: publicProcedure.input(z.object({
        username: z.string(),
        password: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const hashedPassword = await hashPassword(input.password);
        await ctx.db.insert(users).values({ username: input.username, hashedPassword });

        const token = generateToken();
        await ctx.db.insert(tokens).values({ username: input.username, token });

        return { token };
    }),
    getUser: publicProcedure.input(z.object({
        username: z.string(),
        password: z.string(),
    })).query(async ({ ctx, input }) => {
        const userResult = await ctx.db.select().from(users).where(eq(users.username, input.username));

        if (!userResult || userResult.length === 0 || !(await verifyPassword(input.password, userResult[0]!.hashedPassword))) {
            return null;
        }

        const tokenResult = await ctx.db.select().from(tokens).where(eq(tokens.username, input.username));

        if (!tokenResult || tokenResult.length === 0) {
            const token = generateToken();
            await ctx.db.insert(tokens).values({ username: input.username, token });

            return { token };
        }

        return { token: tokenResult[0]!.token };
    }),
    getUserByToken: publicProcedure.input(z.object({
        token: z.string(),
    })).query(async ({ ctx, input }) => {
        const tokenResult = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));

        if (!tokenResult || tokenResult.length === 0) {
            return null;
        }

        return { token: tokenResult[0]!.token };
    }),
});

export default userRouter;