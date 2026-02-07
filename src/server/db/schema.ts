// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, primaryKey, sqliteTableCreator } from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 * NOTE: compta_ is the prefix for the table names, you can change it
 */
export const createTable = sqliteTableCreator((name) => `compta_${name}`);

export const users = createTable(
    "users",
    (d) => ({
        username: d.text("username").notNull().unique().primaryKey(),
        picture: d.blob("picture"),
        type: d.text("type"),
        hashedPassword: d.text("hashed_password").notNull(),
        createdAt: d
            .text("timestamp")
            .notNull()
            .default(sql`(current_timestamp)`),
    }),
    (t) => [index("users_created_at_idx").on(t.createdAt)]
);

export const tokens = createTable(
    "tokens",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        username: d
            .text("username")
            .notNull()
            .references(() => users.username),
        token: d.text("token").notNull(),
        createdAt: d
            .text("timestamp")
            .notNull()
            .default(sql`(current_timestamp)`),
    }),
    (t) => [
        index("tokens_created_at_idx").on(t.createdAt),
        index("tokens_token_idx").on(t.token), // Pour les recherches par token (getUserByToken)
        index("tokens_username_idx").on(t.username), // Pour les recherches par username
    ]
);

export const countCategories = createTable(
    "count_categories",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
        default: d.integer({ mode: "boolean" }).notNull().default(false),
    }),
    (t) => [index("categories_name_idx").on(t.name)]
);

export const countMonths = createTable(
    "count_months",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        year: d.integer({ mode: "number" }).notNull(),
        month: d.integer({ mode: "number" }).notNull(),
    }),
    (t) => [index("months_year_month_idx").on(t.year, t.month)]
);

export const countInteractions = createTable(
    "count_interactions",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
        monthId: d
            .integer({ mode: "number" })
            .notNull()
            .references(() => countMonths.id),
        categoryId: d
            .integer({ mode: "number" })
            .notNull()
            .references(() => countCategories.id),
        amount: d.integer({ mode: "number" }).notNull(),
        username: d
            .text("username_payer")
            .notNull()
            .references(() => users.username),
        isDefault: d.integer({ mode: "boolean" }).notNull().default(false),
    }),
    (t) => [
        index("interactions_month_id_category_id_idx").on(
            t.monthId,
            t.categoryId
        ),
        index("interactions_month_id_username_payer_idx").on(
            t.monthId,
            t.username
        ), // Pour getCurrentMonth (WHERE monthId AND usernamePayer)
        index("interactions_username_payer_idx").on(t.username), // Pour createNewMonth (WHERE usernamePayer)
    ]
);

export const tri = createTable(
    "tri",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
    }),
    (t) => [index("tri_name_idx").on(t.name)]
);

export const tri_users = createTable(
    "tri_users",
    (d) => ({
        idTri: d
            .integer({ mode: "number" })
            .notNull()
            .references(() => tri.id),
        username: d
            .text("username")
            .notNull()
            .references(() => users.username),
    }),
    (t) => [
        primaryKey({ columns: [t.idTri, t.username] }),
        index("tri_users_username_idx").on(t.username),
        index("tri_users_id_tri_idx").on(t.idTri),
    ]
);

export const tri_categories = createTable(
    "tri_categories",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
    }),
    (t) => [index("tri_categories_name_idx").on(t.name)]
);

export const tri_categories_regex = createTable(
    "tri_categories_regex",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        regex: d.text("regex").notNull(),
        categoryId: d
            .integer({ mode: "number" })
            .notNull()
            .references(() => tri_categories.id),
    }),
    (t) => [
        index("tri_categories_regex_category_id_idx").on(t.categoryId),
        index("tri_categories_regex_regex_idx").on(t.regex),
    ]
);

export const tri_interactions = createTable(
    "tri_interactions",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        name: d.text("name").notNull(),
        amount: d.integer({ mode: "number" }).notNull(),
        categoryId: d
            .integer({ mode: "number" })
            .notNull()
            .references(() => tri_categories.id),
        triId: d
            .integer({ mode: "number" })
            .notNull()
            .references(() => tri.id),
        isRefunded: d.integer({ mode: "boolean" }).notNull().default(false),
        usernamePayer: d
            .text("username_payer")
            .notNull()
            .references(() => users.username),
        date: d
            .text("date")
            .notNull()
            .default(sql`(current_timestamp)`),
    }),
    (t) => [
        index("tri_interactions_tri_id_idx").on(t.triId), // Pour getInteractionsByTricount (WHERE triId)
        index("tri_interactions_id_tri_id_idx").on(t.id, t.triId), // Pour removeInteraction et setInteractionRefunded (WHERE id AND triId)
        index("tri_interactions_date_idx").on(t.date), // Pour trier par date
    ]
);

export const tri_users_payees = createTable(
    "tri_users_payees",
    (d) => ({
        idInteraction: d
            .integer({ mode: "number" })
            .notNull()
            .references(() => tri_interactions.id),
        usernamePayee: d
            .text("username_payee")
            .notNull()
            .references(() => users.username),
        amount: d.integer({ mode: "number" }).notNull(),
    }),
    (t) => [
        primaryKey({ columns: [t.idInteraction, t.usernamePayee] }),
        index("tri_users_payees_id_interaction_idx").on(t.idInteraction), // Pour getInteractionsByTricount et removeInteraction (WHERE idInteraction IN (...))
        index("tri_users_payees_username_payee_idx").on(t.usernamePayee), // Pour les futures requêtes par utilisateur payeur
    ]
);

export const pushSubscriptions = createTable(
    "push_subscriptions",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        username: d
            .text("username")
            .notNull()
            .references(() => users.username),
        endpoint: d.text("endpoint").notNull().unique(),
        p256dh: d.text("p256dh").notNull(), // Public key
        auth: d.text("auth").notNull(), // Auth secret
        createdAt: d
            .text("created_at")
            .notNull()
            .default(sql`(current_timestamp)`),
    }),
    (t) => [
        index("push_subscriptions_username_idx").on(t.username),
        index("push_subscriptions_endpoint_idx").on(t.endpoint),
    ]
);

export const etfs = createTable(
    "etfs",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        username: d
            .text("username")
            .notNull()
            .references(() => users.username),
        name: d.text("name").notNull(),
        identifier: d.text("identifier").notNull(),
        yahooSymbol: d.text("yahoo_symbol").notNull(),
        yahooName: d.text("yahoo_name").notNull().default(""),
        annualFeePercent: d.real("annual_fee_percent").notNull().default(0),
        createdAt: d
            .text("created_at")
            .notNull()
            .default(sql`(current_timestamp)`),
    }),
    (t) => [
        index("etfs_username_idx").on(t.username),
        index("etfs_yahoo_symbol_idx").on(t.yahooSymbol),
    ]
);

export const stockTransactions = createTable(
    "stock_transactions",
    (d) => ({
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        etfId: d
            .integer({ mode: "number" })
            .notNull()
            .references(() => etfs.id),
        username: d
            .text("username")
            .notNull()
            .references(() => users.username),
        date: d
            .text("date")
            .notNull()
            .default(sql`(current_timestamp)`),
        side: d.text("side").notNull().default("buy"),
        quantity: d.real("quantity").notNull(),
        price: d.real("price").notNull(),
        operationFee: d.real("operation_fee").notNull().default(0),
    }),
    (t) => [
        index("stock_transactions_etf_id_idx").on(t.etfId),
        index("stock_transactions_username_idx").on(t.username),
        index("stock_transactions_date_idx").on(t.date),
    ]
);
