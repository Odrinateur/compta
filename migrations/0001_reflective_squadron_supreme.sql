PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_compta_users` (
	`username` text PRIMARY KEY NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_compta_users`("username", "timestamp") SELECT "username", "timestamp" FROM `compta_users`;--> statement-breakpoint
DROP TABLE `compta_users`;--> statement-breakpoint
ALTER TABLE `__new_compta_users` RENAME TO `compta_users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `compta_users_username_unique` ON `compta_users` (`username`);--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `compta_users` (`timestamp`);