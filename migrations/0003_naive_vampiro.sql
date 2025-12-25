CREATE TABLE `compta_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`token` text NOT NULL,
	`timestamp` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`username`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tokens_created_at_idx` ON `compta_tokens` (`timestamp`);