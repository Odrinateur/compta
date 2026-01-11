CREATE TABLE `compta_tri_categories_regex` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`regex` text NOT NULL,
	`categoryId` integer NOT NULL,
	FOREIGN KEY (`categoryId`) REFERENCES `compta_tri_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tri_categories_regex_category_id_idx` ON `compta_tri_categories_regex` (`categoryId`);--> statement-breakpoint
CREATE INDEX `tri_categories_regex_regex_idx` ON `compta_tri_categories_regex` (`regex`);