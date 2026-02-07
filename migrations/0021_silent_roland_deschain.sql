CREATE TABLE `compta_etfs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`identifier` text NOT NULL,
	`yahoo_symbol` text NOT NULL,
	`yahoo_name` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT (current_timestamp) NOT NULL,
	FOREIGN KEY (`username`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `etfs_username_idx` ON `compta_etfs` (`username`);--> statement-breakpoint
CREATE INDEX `etfs_yahoo_symbol_idx` ON `compta_etfs` (`yahoo_symbol`);--> statement-breakpoint
CREATE TABLE `compta_stock_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`etfId` integer NOT NULL,
	`username` text NOT NULL,
	`date` text DEFAULT (current_timestamp) NOT NULL,
	`side` text DEFAULT 'buy' NOT NULL,
	`quantity` real NOT NULL,
	`price` real NOT NULL,
	FOREIGN KEY (`etfId`) REFERENCES `compta_etfs`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`username`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `stock_transactions_etf_id_idx` ON `compta_stock_transactions` (`etfId`);--> statement-breakpoint
CREATE INDEX `stock_transactions_username_idx` ON `compta_stock_transactions` (`username`);--> statement-breakpoint
CREATE INDEX `stock_transactions_date_idx` ON `compta_stock_transactions` (`date`);