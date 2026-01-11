import z from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { tri_categories, tri_categories_regex } from "@/server/db/schema";
import { getUserIfExist } from "../user";
import { hasAccess } from "./tricount";
import { and, eq } from "drizzle-orm";

const tricountCategoryRouter = createTRPCRouter({
    getCategoriesByTricount: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            return await ctx.db.select().from(tri_categories);
        }),

    getCategoriesRegexes: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
            })
        )
        .query(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            const results = await ctx.db
                .select({
                    category: tri_categories,
                    regex: tri_categories_regex,
                })
                .from(tri_categories)
                .leftJoin(
                    tri_categories_regex,
                    eq(tri_categories_regex.categoryId, tri_categories.id)
                );

            // Grouper les résultats par catégorie
            const categoriesMap = new Map<
                number,
                {
                    id: number;
                    name: string;
                    regexes: { id: number; regex: string }[];
                }
            >();

            for (const row of results) {
                const categoryId = row.category.id;
                if (!categoriesMap.has(categoryId)) {
                    categoriesMap.set(categoryId, {
                        id: row.category.id,
                        name: row.category.name,
                        regexes: [],
                    });
                }

                // Ajouter la regex si elle existe
                if (row.regex) {
                    categoriesMap.get(categoryId)!.regexes.push({
                        id: row.regex.id,
                        regex: row.regex.regex,
                    });
                }
            }

            return Array.from(categoriesMap.values());
        }),

    createCategoryRegex: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
                idCategory: z.number(),
                regex: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            await ctx.db.insert(tri_categories_regex).values({
                regex: input.regex,
                categoryId: input.idCategory,
            });
        }),

    updateCategoryRegex: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
                idCategory: z.number(),
                idRegex: z.number(),
                regex: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            const regexToUpdate = await ctx.db
                .select()
                .from(tri_categories_regex)
                .where(
                    and(
                        eq(tri_categories_regex.id, input.idRegex),
                        eq(tri_categories_regex.categoryId, input.idCategory)
                    )
                )
                .limit(1);

            if (regexToUpdate.length === 0) {
                throw new Error(
                    "Regex not found or does not belong to category"
                );
            }

            await ctx.db
                .update(tri_categories_regex)
                .set({ regex: input.regex })
                .where(
                    and(
                        eq(tri_categories_regex.id, input.idRegex),
                        eq(tri_categories_regex.categoryId, input.idCategory)
                    )
                );
        }),

    deleteCategoryRegex: publicProcedure
        .input(
            z.object({
                token: z.string(),
                idTri: z.number(),
                idCategory: z.number(),
                idRegex: z.number(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await getUserIfExist(ctx, input.token);

            await hasAccess(ctx, user.username, input.idTri);

            const regexToDelete = await ctx.db
                .select()
                .from(tri_categories_regex)
                .where(
                    and(
                        eq(tri_categories_regex.id, input.idRegex),
                        eq(tri_categories_regex.categoryId, input.idCategory)
                    )
                )
                .limit(1);

            if (regexToDelete.length === 0) {
                throw new Error(
                    "Regex not found or does not belong to category"
                );
            }

            await ctx.db
                .delete(tri_categories_regex)
                .where(
                    and(
                        eq(tri_categories_regex.id, input.idRegex),
                        eq(tri_categories_regex.categoryId, input.idCategory)
                    )
                );
        }),
});

export default tricountCategoryRouter;
