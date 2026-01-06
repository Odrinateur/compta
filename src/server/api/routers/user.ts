import z from "zod";
import { type createTRPCContext, createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tokens, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateToken } from "@/lib/token";
import { TRPCError } from "@trpc/server";
import { type MeUser } from "@/server/db/types";
import { base64ToUint8Array, uint8ArrayToBase64 } from "@/lib/utils";

const userRouter = createTRPCRouter({
    createUser: publicProcedure.input(z.object({
        username: z.string(),
        password: z.string(),
        picture: z.string().optional(),
        type: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
        const userResult = await ctx.db.select().from(users).where(eq(users.username, input.username));
        if (userResult && userResult.length > 0) {
            throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
        }

        const hashedPassword = await hashPassword(input.password);
        const pictureBuffer = input.picture ? base64ToUint8Array(input.picture) : undefined;

        await ctx.db.insert(users).values({
            username: input.username,
            hashedPassword,
            ...(pictureBuffer !== undefined && { picture: pictureBuffer }),
            type: input.type,
        });

        const token = generateToken();
        await ctx.db.insert(tokens).values({ username: input.username, token });

        return { token };
    }),
    getUser: publicProcedure.input(z.object({
        username: z.string(),
        password: z.string(),
    })).query(async ({ ctx, input }) => {
        const userResult = await ctx.db.select().from(users).where(eq(users.username, input.username));

        if (!userResult || userResult.length === 0) {
            return null;
        } else if (!(await verifyPassword(input.password, userResult[0]!.hashedPassword))) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid password" });
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
    })).query(async ({ ctx, input }): Promise<MeUser | null> => {
        const tokenResult = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));

        if (!tokenResult || tokenResult.length === 0) {
            return null;
        }

        const username = tokenResult[0]!.username;
        const userResult = await ctx.db.select().from(users).where(eq(users.username, username));

        if (!userResult || userResult.length === 0) {
            return null;
        }

        const picture = userResult[0]!.picture;

        return {
            token: tokenResult[0]!.token,
            username,
            picture: picture ? uint8ArrayToBase64(picture as Uint8Array) : null,
            type: userResult[0]!.type,
        };
    }),
});

const getUserIfExist = async (ctx: Awaited<ReturnType<typeof createTRPCContext>>, token: string) => {
    const user = await ctx.db.select().from(tokens).where(eq(tokens.token, token));
    if (!user || user.length === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
    }
    return user[0]!;
}

export default userRouter;
export { getUserIfExist };