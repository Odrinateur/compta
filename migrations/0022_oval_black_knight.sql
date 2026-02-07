ALTER TABLE `compta_etfs` ADD `annual_fee_percent` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `compta_stock_transactions` ADD `operation_fee` real DEFAULT 0 NOT NULL;