CREATE INDEX `every_month_interactions_is_active_idx` ON `compta_count_every_month_interactions` (`isActive`);--> statement-breakpoint
CREATE INDEX `interactions_month_id_username_payer_idx` ON `compta_count_interactions` (`monthId`,`username_payer`);--> statement-breakpoint
CREATE INDEX `interactions_username_payer_idx` ON `compta_count_interactions` (`username_payer`);--> statement-breakpoint
CREATE INDEX `tokens_token_idx` ON `compta_tokens` (`token`);--> statement-breakpoint
CREATE INDEX `tokens_username_idx` ON `compta_tokens` (`username`);--> statement-breakpoint
CREATE INDEX `tri_interactions_tri_id_idx` ON `compta_tri_interactions` (`triId`);--> statement-breakpoint
CREATE INDEX `tri_interactions_id_tri_id_idx` ON `compta_tri_interactions` (`id`,`triId`);--> statement-breakpoint
CREATE INDEX `tri_interactions_date_idx` ON `compta_tri_interactions` (`date`);--> statement-breakpoint
CREATE INDEX `tri_users_payees_id_interaction_idx` ON `compta_tri_users_payees` (`idInteraction`);--> statement-breakpoint
CREATE INDEX `tri_users_payees_username_payee_idx` ON `compta_tri_users_payees` (`username_payee`);