ALTER TABLE `pages` ADD `kind` text DEFAULT 'doc' NOT NULL;--> statement-breakpoint
ALTER TABLE `pages` ADD `cover` text;--> statement-breakpoint
ALTER TABLE `pages` ADD `meta` text;