ALTER TABLE `compta_categories` RENAME TO `compta_count_categories`;--> statement-breakpoint
ALTER TABLE `compta_every_month_interactions` RENAME TO `compta_count_every_month_interactions`;--> statement-breakpoint
ALTER TABLE `compta_interactions` RENAME TO `compta_count_interactions`;--> statement-breakpoint
ALTER TABLE `compta_months` RENAME TO `compta_count_months`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_compta_count_every_month_interactions` (
	`idInteraction` integer PRIMARY KEY NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`idInteraction`) REFERENCES `compta_count_interactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_compta_count_every_month_interactions`("idInteraction", "isActive") SELECT "idInteraction", "isActive" FROM `compta_count_every_month_interactions`;--> statement-breakpoint
DROP TABLE `compta_count_every_month_interactions`;--> statement-breakpoint
ALTER TABLE `__new_compta_count_every_month_interactions` RENAME TO `compta_count_every_month_interactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `every_month_interactions_id_interaction_idx` ON `compta_count_every_month_interactions` (`idInteraction`);--> statement-breakpoint
CREATE TABLE `__new_compta_count_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`monthId` integer NOT NULL,
	`categoryId` integer NOT NULL,
	`amount` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`monthId`) REFERENCES `compta_count_months`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoryId`) REFERENCES `compta_count_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_compta_count_interactions`("id", "name", "monthId", "categoryId", "amount", "user_id") SELECT "id", "name", "monthId", "categoryId", "amount", "user_id" FROM `compta_count_interactions`;--> statement-breakpoint
DROP TABLE `compta_count_interactions`;--> statement-breakpoint
ALTER TABLE `__new_compta_count_interactions` RENAME TO `compta_count_interactions`;--> statement-breakpoint
CREATE INDEX `interactions_month_id_category_id_idx` ON `compta_count_interactions` (`monthId`,`categoryId`);