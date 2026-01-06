PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_compta_tri_users_payees` (
	`idInteraction` integer NOT NULL,
	`user_id_payee` text NOT NULL,
	`amount` integer NOT NULL,
	PRIMARY KEY(`idInteraction`, `user_id_payee`),
	FOREIGN KEY (`idInteraction`) REFERENCES `compta_tri_interactions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id_payee`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_compta_tri_users_payees`("idInteraction", "user_id_payee", "amount") SELECT "idInteraction", "user_id_payee", "amount" FROM `compta_tri_users_payees`;--> statement-breakpoint
DROP TABLE `compta_tri_users_payees`;--> statement-breakpoint
ALTER TABLE `__new_compta_tri_users_payees` RENAME TO `compta_tri_users_payees`;--> statement-breakpoint
PRAGMA foreign_keys=ON;