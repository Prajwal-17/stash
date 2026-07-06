CREATE TABLE `reading_list` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`url` text NOT NULL,
	`title` text,
	`hostname` text,
	`description` text,
	`scheduled_for` integer,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`updated_at` text DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	CONSTRAINT `fk_reading_list_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `reading_list_userId_isRead_scheduledFor_idx` ON `reading_list` (`user_id`,`is_read`,`scheduled_for`);