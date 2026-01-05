import z from "zod";
import { createTRPCRouter, publicProcedure, type createTRPCContext } from "@/server/api/trpc";
import { tokens, tri, tri_categories, tri_interactions, tri_users, users } from "@/server/db/schema";
import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";


const tricountRouter = createTRPCRouter({
    getTricountsByUser: publicProcedure.input(z.object({
        token: z.string(),
    })).query(async ({ ctx, input }) => {
        // TODO: factorize this into a helper function
        const user = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));
        if (!user || user.length === 0) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        return await ctx.db
            .select({
                ...getTableColumns(tri)
            })
            .from(tri)
            .leftJoin(tri_users, eq(tri.id, tri_users.idTri))
            .where(eq(tri_users.userId, user[0]!.username));
    }),
    getTricountById: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));
        if (!user || user.length === 0) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        await hasAccess(ctx, user[0]!.username, input.idTri);

        const triData = await ctx.db
            .select({
                ...getTableColumns(tri),
            })
            .from(tri)
            .where(eq(tri.id, input.idTri))
            .limit(1);

        if (!triData || triData.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
        }

        const tricountUsers = await ctx.db
            .select({
                username: users.username,
            })
            .from(tri_users)
            .leftJoin(users, eq(tri_users.userId, users.username))
            .where(eq(tri_users.idTri, input.idTri));

        const interactions = await ctx.db
            .select({
                ...getTableColumns(tri_interactions),
                category: getTableColumns(tri_categories),
            })
            .from(tri_interactions)
            .leftJoin(tri_categories, eq(tri_interactions.categoryId, tri_categories.id))
            .where(eq(tri_interactions.triId, input.idTri));

        return {
            ...triData[0],
            users: tricountUsers.map(u => u.username).filter((u): u is string => u !== null),
            interactions,
        };
    }),
    createTricount: publicProcedure.input(z.object({
        token: z.string(),
        name: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));
        if (!user || user.length === 0) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        const triData = await ctx.db.insert(tri).values({ name: input.name }).returning();

        await ctx.db.insert(tri_users).values({ userId: user[0]!.username, idTri: triData[0]!.id, role: "owner" }).returning();

        return triData[0]!.id;
    }),
    addUserToTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        userId: z.string(),
        role: z.enum(["writer", "reader"]),
    })).mutation(async ({ ctx, input }) => {
        const user = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));
        if (!user || user.length === 0) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        await hasAccess(ctx, user[0]!.username, input.idTri, "owner");

        const triData = await ctx.db.select().from(tri).where(eq(tri.id, input.idTri));
        if (!triData || triData.length === 0) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
        }

        await ctx.db.insert(tri_users).values({ userId: input.userId, idTri: triData[0]!.id, role: input.role });
    }),
    removeUserFromTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        userId: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));
        if (!user || user.length === 0) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        await hasAccess(ctx, user[0]!.username, input.idTri, "owner");

        await ctx.db.delete(tri_users).where(and(eq(tri_users.userId, input.userId), eq(tri_users.idTri, input.idTri)));
    }),
    getUsersNotInTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await ctx.db.select().from(tokens).where(eq(tokens.token, input.token));
        if (!user || user.length === 0) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        }

        await hasAccess(ctx, user[0]!.username, input.idTri, "owner");

        return await ctx.db
            .select({ users: users.username })
            .from(users)
            .leftJoin(tri_users, and(eq(tri_users.userId, users.username), eq(tri_users.idTri, input.idTri)))
            .where(isNull(tri_users.userId));
    }),
});


const hasAccess = async (ctx: Awaited<ReturnType<typeof createTRPCContext>>, username: string, idTri: number, checkRole: "owner" | "writer" | "reader" | "any" = "any") => {
    const userAccess = await ctx.db
        .select()
        .from(tri_users)
        .where(and(eq(tri_users.userId, username), eq(tri_users.idTri, idTri)))
        .limit(1);

    if ((!userAccess || userAccess.length === 0) || (checkRole !== "any" && userAccess[0]!.role !== checkRole)) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
    }
}

export default tricountRouter;