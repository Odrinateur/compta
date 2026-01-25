CREATE TABLE `compta_push_subscriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`username`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `compta_push_subscriptions_endpoint_unique` ON `compta_push_subscriptions` (`endpoint`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_username_idx` ON `compta_push_subscriptions` (`username`);--> statement-breakpoint
CREATE INDEX `push_subscriptions_endpoint_idx` ON `compta_push_subscriptions` (`endpoint`);