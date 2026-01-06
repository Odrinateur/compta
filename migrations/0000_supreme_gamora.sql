CREATE TABLE `compta_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`default` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE INDEX `categories_name_idx` ON `compta_categories` (`name`);--> statement-breakpoint
CREATE TABLE `compta_every_month_interactions` (
	`idInteraction` integer PRIMARY KEY NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`idInteraction`) REFERENCES `compta_interactions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `every_month_interactions_id_interaction_idx` ON `compta_every_month_interactions` (`idInteraction`);--> statement-breakpoint
CREATE TABLE `compta_interactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`monthId` integer NOT NULL,
	`categoryId` integer NOT NULL,
	`amount` integer NOT NULL,
	FOREIGN KEY (`monthId`) REFERENCES `compta_months`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`categoryId`) REFERENCES `compta_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `interactions_month_id_category_id_idx` ON `compta_interactions` (`monthId`,`categoryId`);--> statement-breakpoint
CREATE TABLE `compta_months` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`year` integer NOT NULL,
	`month` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `months_year_month_idx` ON `compta_months` (`year`,`month`);--> statement-breakpoint
CREATE TABLE `compta_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS `users_created_at_idx`;--> statement-breakpoint
CREATE INDEX `users_created_at_idx` ON `compta_users` (`timestamp`);