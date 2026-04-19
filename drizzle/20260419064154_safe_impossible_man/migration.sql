CREATE TABLE `account` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`idToken` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `apikey` (
	`id` text PRIMARY KEY,
	`name` text,
	`start` text,
	`prefix` text,
	`key` text NOT NULL,
	`userId` text NOT NULL,
	`referenceId` text,
	`refillInterval` integer,
	`refillAmount` integer,
	`lastRefillAt` integer,
	`enabled` integer DEFAULT true,
	`rateLimitEnabled` integer DEFAULT true,
	`rateLimitTimeWindow` integer DEFAULT 86400000,
	`rateLimitMax` integer DEFAULT 10,
	`requestCount` integer DEFAULT 0,
	`remaining` integer,
	`lastRequest` integer,
	`expiresAt` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`permissions` text,
	`metadata` text
);
--> statement-breakpoint
CREATE TABLE `form_analytics_daily` (
	`id` text PRIMARY KEY,
	`formId` text NOT NULL,
	`date` text NOT NULL,
	`totalVisits` integer DEFAULT 0 NOT NULL,
	`uniqueVisitors` integer DEFAULT 0 NOT NULL,
	`totalSubmissions` integer DEFAULT 0 NOT NULL,
	`uniqueSubmitters` integer DEFAULT 0 NOT NULL,
	`avgDurationMs` integer,
	`medianDurationMs` integer,
	`deviceDesktop` integer DEFAULT 0,
	`deviceMobile` integer DEFAULT 0,
	`deviceTablet` integer DEFAULT 0,
	`browserChrome` integer DEFAULT 0,
	`browserFirefox` integer DEFAULT 0,
	`browserSafari` integer DEFAULT 0,
	`browserEdge` integer DEFAULT 0,
	`browserOther` integer DEFAULT 0,
	`osWindows` integer DEFAULT 0,
	`osMacos` integer DEFAULT 0,
	`osIos` integer DEFAULT 0,
	`osAndroid` integer DEFAULT 0,
	`osLinux` integer DEFAULT 0,
	`osOther` integer DEFAULT 0,
	`countryBreakdown` text DEFAULT '{}' NOT NULL,
	`cityBreakdown` text DEFAULT '{}' NOT NULL,
	`sourceBreakdown` text DEFAULT '{}' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `form_dropoff_daily` (
	`id` text PRIMARY KEY,
	`formId` text NOT NULL,
	`date` text NOT NULL,
	`questionId` text NOT NULL,
	`questionIndex` integer NOT NULL,
	`viewCount` integer DEFAULT 0 NOT NULL,
	`startCount` integer DEFAULT 0 NOT NULL,
	`completeCount` integer DEFAULT 0 NOT NULL,
	`dropoffCount` integer DEFAULT 0 NOT NULL,
	`dropoffRate` integer,
	`completionRate` integer,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `form_favorites` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`formId` text NOT NULL,
	`createdAt` integer NOT NULL,
	CONSTRAINT `fk_form_favorites_formId_forms_id_fk` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `form_notification_preferences` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`formId` text NOT NULL,
	`inAppNotifications` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_form_notification_preferences_formId_forms_id_fk` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `form_question_progress` (
	`id` text PRIMARY KEY,
	`formId` text NOT NULL,
	`visitId` text NOT NULL,
	`visitorHash` text NOT NULL,
	`questionId` text NOT NULL,
	`questionType` text,
	`questionIndex` integer NOT NULL,
	`viewedAt` integer NOT NULL,
	`startedAt` integer,
	`completedAt` integer,
	`wasLastQuestion` integer DEFAULT false NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `form_submission_notifications` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`formId` text NOT NULL,
	`unreadCount` integer DEFAULT 0 NOT NULL,
	`isRead` integer DEFAULT true NOT NULL,
	`firstUnreadAt` integer,
	`latestSubmissionAt` integer NOT NULL,
	`latestSubmissionId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	CONSTRAINT `fk_form_submission_notifications_formId_forms_id_fk` FOREIGN KEY (`formId`) REFERENCES `forms`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `form_versions` (
	`id` text PRIMARY KEY,
	`formId` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`settings` text NOT NULL,
	`customization` text DEFAULT '{}',
	`title` text NOT NULL,
	`publishedByUserId` text NOT NULL,
	`publishedAt` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `form_visits` (
	`id` text PRIMARY KEY,
	`formId` text NOT NULL,
	`visitorHash` text NOT NULL,
	`sessionId` text NOT NULL,
	`referrer` text,
	`utmSource` text,
	`utmMedium` text,
	`utmCampaign` text,
	`deviceType` text,
	`browser` text,
	`browserVersion` text,
	`os` text,
	`osVersion` text,
	`country` text,
	`countryName` text,
	`city` text,
	`region` text,
	`visitStartedAt` integer NOT NULL,
	`visitEndedAt` integer,
	`durationMs` integer,
	`didStartForm` integer DEFAULT false NOT NULL,
	`didSubmit` integer DEFAULT false NOT NULL,
	`submissionId` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `forms` (
	`id` text PRIMARY KEY,
	`createdByUserId` text NOT NULL,
	`workspaceId` text NOT NULL,
	`title` text DEFAULT 'Untitled' NOT NULL,
	`formName` text DEFAULT 'draft' NOT NULL,
	`schemaName` text DEFAULT 'draftFormSchema' NOT NULL,
	`content` text DEFAULT '[]' NOT NULL,
	`settings` text DEFAULT '{}' NOT NULL,
	`icon` text,
	`cover` text,
	`isMultiStep` integer DEFAULT false NOT NULL,
	`kind` text DEFAULT 'form' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`deletedAt` integer,
	`lastPublishedVersionId` text,
	`publishedContentHash` text,
	`language` text DEFAULT 'English' NOT NULL,
	`redirectOnCompletion` integer DEFAULT false NOT NULL,
	`redirectUrl` text,
	`redirectDelay` integer DEFAULT 0 NOT NULL,
	`progressBar` integer DEFAULT false NOT NULL,
	`branding` integer DEFAULT true NOT NULL,
	`autoJump` integer DEFAULT false NOT NULL,
	`saveAnswersForLater` integer DEFAULT true NOT NULL,
	`selfEmailNotifications` integer DEFAULT false NOT NULL,
	`notificationEmail` text,
	`respondentEmailNotifications` integer DEFAULT false NOT NULL,
	`respondentEmailSubject` text,
	`respondentEmailBody` text,
	`passwordProtect` integer DEFAULT false NOT NULL,
	`password` text,
	`closeForm` integer DEFAULT false NOT NULL,
	`closedFormMessage` text DEFAULT 'This form is now closed.',
	`closeOnDate` integer DEFAULT false NOT NULL,
	`closeDate` text,
	`limitSubmissions` integer DEFAULT false NOT NULL,
	`maxSubmissions` integer,
	`preventDuplicateSubmissions` integer DEFAULT false NOT NULL,
	`dataRetention` integer DEFAULT false NOT NULL,
	`dataRetentionDays` integer,
	`customization` text DEFAULT '{}',
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `invitation` (
	`id` text PRIMARY KEY,
	`email` text NOT NULL,
	`inviterId` text NOT NULL,
	`organizationId` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `member` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`organizationId` text NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `organization` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text UNIQUE,
	`logo` text,
	`metadata` text,
	`createdAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`userId` text NOT NULL,
	`token` text NOT NULL UNIQUE,
	`expiresAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`activeOrganizationId` text
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` text PRIMARY KEY,
	`formId` text NOT NULL,
	`formVersionId` text,
	`data` text DEFAULT '{}' NOT NULL,
	`isCompleted` integer DEFAULT true NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `todos` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`title` text NOT NULL,
	`createdAt` integer
);
--> statement-breakpoint
CREATE TABLE `twoFactor` (
	`id` text PRIMARY KEY,
	`secret` text NOT NULL,
	`backupCodes` text NOT NULL,
	`userId` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `upload_rate_limits` (
	`ip` text PRIMARY KEY,
	`window_start` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`emailVerified` integer DEFAULT false NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`username` text UNIQUE,
	`displayUsername` text,
	`twoFactorEnabled` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY,
	`organizationId` text NOT NULL,
	`createdByUserId` text NOT NULL,
	`name` text DEFAULT 'Collection' NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_form_analytics_daily_form_id_date` ON `form_analytics_daily` (`formId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_form_dropoff_daily_form_id_date` ON `form_dropoff_daily` (`formId`,`date`);--> statement-breakpoint
CREATE INDEX `idx_form_favorites_user_id` ON `form_favorites` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_form_favorites_user_id_form_id` ON `form_favorites` (`userId`,`formId`);--> statement-breakpoint
CREATE INDEX `idx_form_notification_preferences_user_id` ON `form_notification_preferences` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_form_notification_preferences_user_id_form_id` ON `form_notification_preferences` (`userId`,`formId`);--> statement-breakpoint
CREATE INDEX `idx_form_submission_notifications_user_id` ON `form_submission_notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_form_submission_notifications_user_id_form_id` ON `form_submission_notifications` (`userId`,`formId`);--> statement-breakpoint
CREATE INDEX `idx_form_submission_notifications_user_id_is_read` ON `form_submission_notifications` (`userId`,`isRead`);--> statement-breakpoint
CREATE INDEX `idx_form_versions_form_id` ON `form_versions` (`formId`);--> statement-breakpoint
CREATE INDEX `idx_form_versions_form_id_version` ON `form_versions` (`formId`,`version`);--> statement-breakpoint
CREATE INDEX `idx_form_visits_form_id` ON `form_visits` (`formId`);--> statement-breakpoint
CREATE INDEX `idx_forms_workspace_id` ON `forms` (`workspaceId`);--> statement-breakpoint
CREATE INDEX `idx_forms_workspace_id_status` ON `forms` (`workspaceId`,`status`);--> statement-breakpoint
CREATE INDEX `idx_forms_id_created_by` ON `forms` (`id`,`createdByUserId`);--> statement-breakpoint
CREATE INDEX `idx_member_user_id_org_id` ON `member` (`userId`,`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_submissions_form_id` ON `submissions` (`formId`);--> statement-breakpoint
CREATE INDEX `idx_submissions_form_id_created_at_id` ON `submissions` (`formId`,`createdAt`,`id`);--> statement-breakpoint
CREATE INDEX `idx_workspaces_organization_id` ON `workspaces` (`organizationId`);--> statement-breakpoint
CREATE INDEX `idx_workspaces_id_created_by` ON `workspaces` (`id`,`createdByUserId`);