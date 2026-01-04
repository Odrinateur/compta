// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, sqliteTableCreator } from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 * NOTE: compta_ is the prefix for the table names, you can change it
 */
export const createTable = sqliteTableCreator(
    (name) => `compta_${name}`,
);

export const users = createTable(
    "users",
    (d) => ({
        username: d.text("username").notNull().unique().primaryKey(),
        hashedPassword: d.text("hashed_password").notNull(),
        createdAt: d.text("timestamp").notNull().default(sql`(current_timestamp)`),
    }),
    (t) => [index("users_created_at_idx").on(t.createdAt)],
);

export const tokens = createTable(
    "tokens",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        username: d.text("username").notNull().references(() => users.username),
        token: d.text("token").notNull(),
        createdAt: d.text("timestamp").notNull().default(sql`(current_timestamp)`),
    }),
    (t) => [index("tokens_created_at_idx").on(t.createdAt)],
);

export const countCategories = createTable(
    "count_categories",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
        default: d.integer({ mode: "boolean" }).notNull().default(false),
    }),
    (t) => [index("categories_name_idx").on(t.name)],
);

export const countMonths = createTable(
    "count_months",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        year: d.integer({ mode: "number" }).notNull(),
        month: d.integer({ mode: "number" }).notNull(),
    }),
    (t) => [index("months_year_month_idx").on(t.year, t.month)],
);

export const countInteractions = createTable(
    "count_interactions",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
        monthId: d.integer({ mode: "number" }).notNull().references(() => countMonths.id),
        categoryId: d.integer({ mode: "number" }).notNull().references(() => countCategories.id),
        amount: d.integer({ mode: "number" }).notNull(),
        userId: d.text("user_id").notNull().references(() => users.username),
    }),
    (t) => [index("interactions_month_id_category_id_idx").on(t.monthId, t.categoryId)],
);

export const countEveryMonthInteractions = createTable(
    "count_every_month_interactions",
    (d) => ({
        idInteraction: d.integer({ mode: "number" }).primaryKey().references(() => countInteractions.id),
        isActive: d.integer({ mode: "boolean" }).notNull().default(true),
    }),
    (t) => [index("every_month_interactions_id_interaction_idx").on(t.idInteraction)],
);


export const tri = createTable(
    "tri",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
    }),
    (t) => [index("tri_name_idx").on(t.name)],
);

export const tri_users = createTable(
    "tri_users",
    (d) => ({
        idTri: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        userId: d.text("user_id").notNull().references(() => users.username),
        role: d.text("role").$type<"owner" | "writer" | "reader">().notNull(),
    }),
    (t) => [index("tri_users_user_id_idx").on(t.userId)],
);

export const tri_categories = createTable(
    "tri_categories",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
    }),
    (t) => [index("tri_categories_name_idx").on(t.name)],
);

export const tri_interactions = createTable(
    "tri_interactions",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
        amount: d.integer({ mode: "number" }).notNull(),
        categoryId: d.integer({ mode: "number" }).notNull().references(() => tri_categories.id),
        triId: d.integer({ mode: "number" }).notNull().references(() => tri.id),
        isRefunded: d.integer({ mode: "boolean" }).notNull().default(false),
        userIdPayer: d.text("user_id_payer").notNull().references(() => users.username),
    }),
);

export const tri_users_payees = createTable(
    "tri_users_payees",
    (d) => ({
        idInteraction: d.integer({ mode: "number" }).primaryKey().references(() => tri_interactions.id),
        userIdPayee: d.text("user_id_payee").notNull().references(() => users.username),
        amount: d.integer({ mode: "number" }).notNull(),
    }),
);