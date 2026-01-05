PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_compta_tri_users` (
	`idTri` integer NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`idTri`, `user_id`),
	FOREIGN KEY (`idTri`) REFERENCES `compta_tri`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `compta_users`(`username`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_compta_tri_users`("idTri", "user_id", "role") SELECT "idTri", "user_id", "role" FROM `compta_tri_users`;--> statement-breakpoint
DROP TABLE `compta_tri_users`;--> statement-breakpoint
ALTER TABLE `__new_compta_tri_users` RENAME TO `compta_tri_users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `tri_users_user_id_idx` ON `compta_tri_users` (`user_id`);--> statement-breakpoint
CREATE INDEX `tri_users_id_tri_idx` ON `compta_tri_users` (`idTri`);