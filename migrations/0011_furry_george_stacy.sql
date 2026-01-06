PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_compta_count_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`monthId` integer NOT NULL,
	`categoryId` integer NOT NULL,
	`amount` integer NOT NULL,
	`username_payer` text NOT NULL,
	FOREIGN KEY (`monthId`) REFERENCES `compta_count_months`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoryId`) REFERENCES `compta_count_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`username_payer`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_compta_count_interactions`("id", "name", "monthId", "categoryId", "amount", "username_payer") SELECT "id", "name", "monthId", "categoryId", "amount", "username_payer" FROM `compta_count_interactions`;--> statement-breakpoint
DROP TABLE `compta_count_interactions`;--> statement-breakpoint
ALTER TABLE `__new_compta_count_interactions` RENAME TO `compta_count_interactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `interactions_month_id_category_id_idx` ON `compta_count_interactions` (`monthId`,`categoryId`);--> statement-breakpoint
CREATE TABLE `__new_compta_tri_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`amount` integer NOT NULL,
	`categoryId` integer NOT NULL,
	`triId` integer NOT NULL,
	`isRefunded` integer DEFAULT false NOT NULL,
	`username_payer` text NOT NULL,
	`date` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `compta_tri_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`triId`) REFERENCES `compta_tri`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`username_payer`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_compta_tri_interactions`("id", "name", "amount", "categoryId", "triId", "isRefunded", "username_payer", "date") SELECT "id", "name", "amount", "categoryId", "triId", "isRefunded", "username_payer", "date" FROM `compta_tri_interactions`;--> statement-breakpoint
DROP TABLE `compta_tri_interactions`;--> statement-breakpoint
ALTER TABLE `__new_compta_tri_interactions` RENAME TO `compta_tri_interactions`;--> statement-breakpoint
CREATE TABLE `__new_compta_tri_users` (
	`idTri` integer NOT NULL,
	`username` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`idTri`, `username`),
	FOREIGN KEY (`idTri`) REFERENCES `compta_tri`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`username`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_compta_tri_users`("idTri", "username", "role") SELECT "idTri", "username", "role" FROM `compta_tri_users`;--> statement-breakpoint
DROP TABLE `compta_tri_users`;--> statement-breakpoint
ALTER TABLE `__new_compta_tri_users` RENAME TO `compta_tri_users`;--> statement-breakpoint
CREATE INDEX `tri_users_username_idx` ON `compta_tri_users` (`username`);--> statement-breakpoint
CREATE INDEX `tri_users_id_tri_idx` ON `compta_tri_users` (`idTri`);--> statement-breakpoint
CREATE TABLE `__new_compta_tri_users_payees` (
	`idInteraction` integer NOT NULL,
	`username_payee` text NOT NULL,
	`amount` integer NOT NULL,
	PRIMARY KEY(`idInteraction`, `username_payee`),
	FOREIGN KEY (`idInteraction`) REFERENCES `compta_tri_interactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`username_payee`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_compta_tri_users_payees`("idInteraction", "username_payee", "amount") SELECT "idInteraction", "username_payee", "amount" FROM `compta_tri_users_payees`;--> statement-breakpoint
DROP TABLE `compta_tri_users_payees`;--> statement-breakpoint
ALTER TABLE `__new_compta_tri_users_payees` RENAME TO `compta_tri_users_payees`;