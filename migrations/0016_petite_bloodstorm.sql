ALTER TABLE `compta_count_months` ADD `totalAmount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `compta_count_interactions` DROP COLUMN `date`;