import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tri_categories, tri_interactions, tri_users_payees, users } from "@/server/db/schema";
import { and, eq, getTableColumns, inArray } from "drizzle-orm";
import { getUserIfExist } from "../user";
import { hasAccess } from "./tricount";
import { type TricountPayee } from "@/server/db/types";
import { uint8ArrayToBase64 } from "@/lib/utils";


const tricountInteractionRouter = createTRPCRouter({
    getInteractionsByTricount: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
    })).query(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        const interactionsRaw = await ctx.db
            .select({
                ...getTableColumns(tri_interactions),
                category: getTableColumns(tri_categories),
                payerPicture: users.picture,
                payerType: users.type,
            })
            .from(tri_interactions)
            .innerJoin(tri_categories, eq(tri_interactions.categoryId, tri_categories.id))
            .innerJoin(users, eq(tri_interactions.usernamePayer, users.username))
            .where(eq(tri_interactions.triId, input.idTri));

        const interactionIds = interactionsRaw.map(i => i.id);
        const allPayees = interactionIds.length > 0 ? await ctx.db
            .select({
                idInteraction: tri_users_payees.idInteraction,
                usernamePayee: tri_users_payees.usernamePayee,
                amount: tri_users_payees.amount,
                picture: users.picture,
                type: users.type,
            })
            .from(tri_users_payees)
            .innerJoin(users, eq(tri_users_payees.usernamePayee, users.username))
            .where(
                inArray(tri_users_payees.idInteraction, interactionIds)
            ) : [];

        return interactionsRaw.map((interaction) => ({
            id: interaction.id,
            name: interaction.name,
            amount: interaction.amount,
            categoryId: interaction.categoryId,
            triId: interaction.triId,
            isRefunded: interaction.isRefunded,
            date: interaction.date,
            category: {
                id: interaction.category.id,
                name: interaction.category.name,
            },
            userPayer: {
                username: interaction.usernamePayer,
                picture: interaction.payerPicture ? uint8ArrayToBase64(interaction.payerPicture as Uint8Array) : null,
                type: interaction.payerType,
            },
            usersPayees: allPayees
                .filter((p) => p.idInteraction === interaction.id)
                .map((p): TricountPayee => ({
                    username: p.usernamePayee,
                    amount: p.amount,
                    picture: p.picture ? uint8ArrayToBase64(p.picture as Uint8Array) : null,
                    type: p.type,
                })),
        }));
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
        usernamePayer: z.string(),
        isRefunded: z.boolean(),
        usersPayees: z.array(z.object({
            username: z.string(),
        })),
        date: z.string(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        const amountInCents = Math.round(input.amount * 100);

        const [newInteraction] = await ctx.db.insert(tri_interactions).values({
            name: input.name,
            amount: amountInCents,
            categoryId: input.categoryId,
            usernamePayer: input.usernamePayer,
            isRefunded: input.isRefunded,
            triId: input.idTri,
            date: input.date,
        }).returning();

        if (!newInteraction) {
            throw new Error("Failed to create interaction");
        }

        for (const userPayee of input.usersPayees) {
            await ctx.db.insert(tri_users_payees).values({
                idInteraction: newInteraction.id,
                usernamePayee: userPayee.username,
                amount: Math.round(amountInCents / input.usersPayees.length),
            });
        }

        return newInteraction;
    }),

    removeInteraction: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        idInteraction: z.number(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        await ctx.db.delete(tri_users_payees).where(eq(tri_users_payees.idInteraction, input.idInteraction));

        await ctx.db.delete(tri_interactions).where(and(eq(tri_interactions.id, input.idInteraction), eq(tri_interactions.triId, input.idTri)));
    }),

    setInteractionRefunded: publicProcedure.input(z.object({
        token: z.string(),
        idTri: z.number(),
        idInteraction: z.number(),
        isRefunded: z.boolean(),
    })).mutation(async ({ ctx, input }) => {
        const user = await getUserIfExist(ctx, input.token);

        await hasAccess(ctx, user.username, input.idTri);

        await ctx.db.update(tri_interactions).set({ isRefunded: input.isRefunded }).where(and(eq(tri_interactions.id, input.idInteraction), eq(tri_interactions.triId, input.idTri)));
    }),
});

export default tricountInteractionRouter;