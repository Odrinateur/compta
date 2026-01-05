import z from "zod";
import { createTRPCRouter, publicProcedure, type createTRPCContext } from "@/server/api/trpc";
import { tri, tri_categories, tri_interactions, tri_users, users } from "@/server/db/schema";
import { and, eq, getTableColumns, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getUserIfExist } from "../user";
import { roleHierarchy, type RoleWithAny } from "@/server/db/types";


const tricountRouter = createTRPCRouter({
    getTricountsByUser: publicProcedure.input(z.object({
        token: z.string(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        return await ctx.db
            .select({
                ...getTableColumns(tri)
            })
            .from(tri)
            .leftJoin(tri_users, eq(tri.id, tri_users.idTri))
            .where(eq(tri_users.userId, user.username));
    }),

    getTricountById: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

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

        const interactions = await ctx.db
            .select({
                ...getTableColumns(tri_interactions),
                category: getTableColumns(tri_categories),
            })
            .from(tri_interactions)
            .innerJoin(tri_categories, eq(tri_interactions.categoryId, tri_categories.id))
            .where(eq(tri_interactions.triId, input.idTri));

        return {
            ...triData[0],
            interactions,
        };
    }),

    createTricount: publicProcedure.input(z.object({
        token: z.string(),
        name: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        const triData = await ctx.db.insert(tri).values({ name: input.name }).returning();

        await ctx.db.insert(tri_users).values({ userId: user.username, idTri: triData[0]!.id, role: "owner" }).returning();

        return triData[0]!.id;
    }),

    addUserToTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        userId: z.string(),
        role: z.enum(["writer", "reader"]),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "owner");

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
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "owner");

        await ctx.db.delete(tri_users).where(and(eq(tri_users.userId, input.userId), eq(tri_users.idTri, input.idTri)));
    }),

    getUsersInTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        const usersInTricount = await ctx.db
            .select({
                username: users.username,
            })
            .from(tri_users)
            .innerJoin(users, eq(tri_users.userId, users.username))
            .where(eq(tri_users.idTri, input.idTri));

        return usersInTricount.map(u => u.username);
    }),

    getUsersNotInTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri, "owner");

        return await ctx.db
            .select({ users: users.username })
            .from(users)
            .leftJoin(tri_users, and(eq(tri_users.userId, users.username), eq(tri_users.idTri, input.idTri)))
            .where(isNull(tri_users.userId));
    }),
});


const hasAccess = async (ctx: Awaited<ReturnType<typeof createTRPCContext>>, username: string, idTri: number, checkRole: RoleWithAny = "any") => {
    const userAccess = await ctx.db
        .select()
        .from(tri_users)
        .where(and(eq(tri_users.userId, username), eq(tri_users.idTri, idTri)))
        .limit(1);

    if (!userAccess || userAccess.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
    }

    if (checkRole === "any") {
        return;
    }

    const userRole = userAccess[0]!.role;
    if (roleHierarchy[userRole] < roleHierarchy[checkRole]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tricount not found" });
    }
}

export default tricountRouter;
export { hasAccess };