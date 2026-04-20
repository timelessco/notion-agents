CREATE TABLE `pages` (
	`id` text PRIMARY KEY,
	`workspaceId` text NOT NULL,
	`parentId` text,
	`createdByUserId` text NOT NULL,
	`title` text DEFAULT 'Untitled' NOT NULL,
	`icon` text,
	`content` text DEFAULT '[]' NOT NULL,
	`deletedAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_pages_workspace_id` ON `pages` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `idx_pages_parent_id` ON `pages` (`parentId`);