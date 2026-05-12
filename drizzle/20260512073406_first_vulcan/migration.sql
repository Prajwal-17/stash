ALTER TABLE `bookmark_to_tags` RENAME TO `stash_to_tags`;--> statement-breakpoint
ALTER TABLE `bookmarks` RENAME TO `stashes`;--> statement-breakpoint
ALTER TABLE `stash_to_tags` RENAME COLUMN `bookmark_id` TO `stash_id`;--> statement-breakpoint
DROP INDEX IF EXISTS `bookmark_tag_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `bookmark_id_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `stash_tag_unique` ON `stash_to_tags` (`stash_id`,`tag_id`);--> statement-breakpoint
CREATE INDEX `stash_id_idx` ON `stash_to_tags` (`stash_id`);