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
        id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
        createdAt: d.text("timestamp").notNull().default(sql`(current_timestamp)`),
    }),
    (t) => [index("users_created_at_idx").on(t.createdAt)],
);
