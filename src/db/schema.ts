import { defineRelations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";

// D1 (SQLite) schema. Conventions:
// - Booleans stored as integers (0/1) via `integer({ mode: "boolean" })`.
// - Timestamps stored as ms-epoch integers via `integer({ mode: "timestamp_ms" })`.
//   Defaults use `.$defaultFn(() => new Date())` — runs client-side in drizzle,
//   so we don't depend on a SQLite-side `now()` function.
// - JSON columns stored as TEXT via `text({ mode: "json" })`; defaults serialize
//   at DDL time.

// ============================================================================
// Organization Tables (Better Auth Organization Plugin)
// ============================================================================

export const organization = sqliteTable("organization", {
  id: text().primaryKey(),
  name: text().notNull(),
  slug: text().unique(),
  logo: text(),
  metadata: text(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const member = sqliteTable(
  "member",
  {
    id: text().primaryKey(),
    userId: text().notNull(),
    organizationId: text().notNull(),
    role: text().notNull().default("member"),
    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("idx_member_user_id_org_id").on(t.userId, t.organizationId)],
);

export const invitation = sqliteTable("invitation", {
  id: text().primaryKey(),
  email: text().notNull(),
  inviterId: text().notNull(),
  organizationId: text().notNull(),
  role: text().notNull().default("member"),
  status: text().notNull().default("pending"),
  expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const todos = sqliteTable("todos", {
  id: integer().primaryKey({ autoIncrement: true }),
  title: text().notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).$defaultFn(() => new Date()),
});

// Better Auth Tables

export const user = sqliteTable("user", {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: integer({ mode: "boolean" }).notNull().default(false),
  image: text(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  username: text().unique(),
  displayUsername: text(),
  twoFactorEnabled: integer({ mode: "boolean" }).default(false),
});

export const session = sqliteTable("session", {
  id: text().primaryKey(),
  userId: text().notNull(),
  token: text().notNull().unique(),
  expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
  ipAddress: text(),
  userAgent: text(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  activeOrganizationId: text(),
});

export const account = sqliteTable("account", {
  id: text().primaryKey(),
  userId: text().notNull(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  accessToken: text(),
  refreshToken: text(),
  accessTokenExpiresAt: integer({ mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer({ mode: "timestamp_ms" }),
  scope: text(),
  idToken: text(),
  password: text(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const verification = sqliteTable("verification", {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: integer({ mode: "timestamp_ms" }).notNull(),
  createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const twoFactor = sqliteTable("twoFactor", {
  id: text().primaryKey(),
  secret: text().notNull(),
  backupCodes: text().notNull(),
  userId: text().notNull(),
});

export const apikey = sqliteTable("apikey", {
  id: text().primaryKey(),
  name: text(),
  start: text(),
  prefix: text(),
  key: text().notNull(),
  userId: text().notNull(),
  referenceId: text(),
  refillInterval: integer(),
  refillAmount: integer(),
  lastRefillAt: integer({ mode: "timestamp_ms" }),
  enabled: integer({ mode: "boolean" }).default(true),
  rateLimitEnabled: integer({ mode: "boolean" }).default(true),
  rateLimitTimeWindow: integer().default(86400000),
  rateLimitMax: integer().default(10),
  requestCount: integer().default(0),
  remaining: integer(),
  lastRequest: integer({ mode: "timestamp_ms" }),
  expiresAt: integer({ mode: "timestamp_ms" }),
  createdAt: integer({ mode: "timestamp_ms" }).notNull(),
  updatedAt: integer({ mode: "timestamp_ms" }).notNull(),
  permissions: text(),
  metadata: text(),
});

export const workspaces = sqliteTable(
  "workspaces",
  {
    id: text().primaryKey(),
    organizationId: text().notNull(),
    createdByUserId: text().notNull(),
    name: text().notNull().default("Collection"),
    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [
    index("idx_workspaces_organization_id").on(t.organizationId),
    index("idx_workspaces_id_created_by").on(t.id, t.createdByUserId),
  ],
);

export const forms = sqliteTable(
  "forms",
  {
    id: text().primaryKey(),
    createdByUserId: text().notNull(),
    workspaceId: text().notNull(),
    title: text().notNull().default("Untitled"),
    formName: text().notNull().default("draft"),
    schemaName: text().notNull().default("draftFormSchema"),
    content: text({ mode: "json" }).notNull().default([]),
    settings: text({ mode: "json" }).notNull().default({}),
    icon: text(),
    cover: text(),
    isMultiStep: integer({ mode: "boolean" }).notNull().default(false),
    kind: text().$type<"form" | "database">().notNull().default("form"),
    status: text().$type<"draft" | "published" | "archived">().notNull().default("draft"),
    deletedAt: integer({ mode: "timestamp_ms" }),
    lastPublishedVersionId: text(),
    publishedContentHash: text(),
    language: text().default("English").notNull(),
    redirectOnCompletion: integer({ mode: "boolean" }).default(false).notNull(),
    redirectUrl: text(),
    redirectDelay: integer().default(0).notNull(),
    progressBar: integer({ mode: "boolean" }).default(false).notNull(),
    branding: integer({ mode: "boolean" }).default(true).notNull(),
    autoJump: integer({ mode: "boolean" }).default(false).notNull(),
    saveAnswersForLater: integer({ mode: "boolean" }).default(true).notNull(),
    selfEmailNotifications: integer({ mode: "boolean" }).default(false).notNull(),
    notificationEmail: text(),
    respondentEmailNotifications: integer({ mode: "boolean" }).default(false).notNull(),
    respondentEmailSubject: text(),
    respondentEmailBody: text(),
    passwordProtect: integer({ mode: "boolean" }).default(false).notNull(),
    password: text(),
    closeForm: integer({ mode: "boolean" }).default(false).notNull(),
    closedFormMessage: text().default("This form is now closed."),
    closeOnDate: integer({ mode: "boolean" }).default(false).notNull(),
    closeDate: text(),
    limitSubmissions: integer({ mode: "boolean" }).default(false).notNull(),
    maxSubmissions: integer(),
    preventDuplicateSubmissions: integer({ mode: "boolean" }).default(false).notNull(),
    dataRetention: integer({ mode: "boolean" }).default(false).notNull(),
    dataRetentionDays: integer(),
    customization: text({ mode: "json" }).default({}),
    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [
    index("idx_forms_workspace_id").on(t.workspaceId),
    index("idx_forms_workspace_id_status").on(t.workspaceId, t.status),
    index("idx_forms_id_created_by").on(t.id, t.createdByUserId),
  ],
);

export const formVersions = sqliteTable(
  "form_versions",
  {
    id: text().primaryKey(),
    formId: text().notNull(),
    version: integer().notNull(),
    content: text({ mode: "json" }).notNull(),
    settings: text({ mode: "json" }).notNull(),
    customization: text({ mode: "json" }).default({}),
    title: text().notNull(),
    publishedByUserId: text().notNull(),
    publishedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [
    index("idx_form_versions_form_id").on(t.formId),
    index("idx_form_versions_form_id_version").on(t.formId, t.version),
  ],
);

export const submissions = sqliteTable(
  "submissions",
  {
    id: text().primaryKey(),
    formId: text().notNull(),
    formVersionId: text(),
    data: text({ mode: "json" }).notNull().default({}),
    isCompleted: integer({ mode: "boolean" }).notNull().default(true),
    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [
    index("idx_submissions_form_id").on(t.formId),
    index("idx_submissions_form_id_created_at_id").on(t.formId, t.createdAt, t.id),
  ],
);

export const formFavorites = sqliteTable(
  "form_favorites",
  {
    id: text().primaryKey(),
    userId: text().notNull(),
    formId: text()
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [
    index("idx_form_favorites_user_id").on(t.userId),
    index("idx_form_favorites_user_id_form_id").on(t.userId, t.formId),
  ],
);

export const formNotificationPreferences = sqliteTable(
  "form_notification_preferences",
  {
    id: text().primaryKey(),
    userId: text().notNull(),
    formId: text()
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    inAppNotifications: integer({ mode: "boolean" }).notNull().default(false),
    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [
    index("idx_form_notification_preferences_user_id").on(t.userId),
    index("idx_form_notification_preferences_user_id_form_id").on(t.userId, t.formId),
  ],
);

export const formSubmissionNotifications = sqliteTable(
  "form_submission_notifications",
  {
    id: text().primaryKey(),
    userId: text().notNull(),
    formId: text()
      .notNull()
      .references(() => forms.id, { onDelete: "cascade" }),
    unreadCount: integer().notNull().default(0),
    isRead: integer({ mode: "boolean" }).notNull().default(true),
    firstUnreadAt: integer({ mode: "timestamp_ms" }),
    latestSubmissionAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    latestSubmissionId: text(),
    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [
    index("idx_form_submission_notifications_user_id").on(t.userId),
    index("idx_form_submission_notifications_user_id_form_id").on(t.userId, t.formId),
    index("idx_form_submission_notifications_user_id_is_read").on(t.userId, t.isRead),
  ],
);

// ============================================================================
// Form Visits Table (Analytics - Raw Events)
// ============================================================================
export const formVisits = sqliteTable(
  "form_visits",
  {
    id: text().primaryKey(),
    formId: text().notNull(),

    visitorHash: text().notNull(),
    sessionId: text().notNull(),

    referrer: text(),
    utmSource: text(),
    utmMedium: text(),
    utmCampaign: text(),

    deviceType: text(),
    browser: text(),
    browserVersion: text(),
    os: text(),
    osVersion: text(),

    country: text(),
    countryName: text(),
    city: text(),
    region: text(),

    visitStartedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    visitEndedAt: integer({ mode: "timestamp_ms" }),
    durationMs: integer(),

    didStartForm: integer({ mode: "boolean" }).notNull().default(false),
    didSubmit: integer({ mode: "boolean" }).notNull().default(false),
    submissionId: text(),

    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("idx_form_visits_form_id").on(t.formId)],
);

// ============================================================================
// Form Question Progress Table (Question Drop-off Tracking)
// ============================================================================
export const formQuestionProgress = sqliteTable("form_question_progress", {
  id: text().primaryKey(),
  formId: text().notNull(),
  visitId: text().notNull(),
  visitorHash: text().notNull(),

  questionId: text().notNull(),
  questionType: text(),
  questionIndex: integer().notNull(),

  viewedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  startedAt: integer({ mode: "timestamp_ms" }),
  completedAt: integer({ mode: "timestamp_ms" }),
  wasLastQuestion: integer({ mode: "boolean" }).notNull().default(false),

  createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

// ============================================================================
// Form Analytics Daily Table (Pre-aggregated Daily Metrics)
// ============================================================================
export const formAnalyticsDaily = sqliteTable(
  "form_analytics_daily",
  {
    id: text().primaryKey(),
    formId: text().notNull(),
    date: text().notNull(),

    totalVisits: integer().notNull().default(0),
    uniqueVisitors: integer().notNull().default(0),
    totalSubmissions: integer().notNull().default(0),
    uniqueSubmitters: integer().notNull().default(0),
    avgDurationMs: integer(),
    medianDurationMs: integer(),

    deviceDesktop: integer().default(0),
    deviceMobile: integer().default(0),
    deviceTablet: integer().default(0),

    browserChrome: integer().default(0),
    browserFirefox: integer().default(0),
    browserSafari: integer().default(0),
    browserEdge: integer().default(0),
    browserOther: integer().default(0),

    osWindows: integer().default(0),
    osMacos: integer().default(0),
    osIos: integer().default(0),
    osAndroid: integer().default(0),
    osLinux: integer().default(0),
    osOther: integer().default(0),

    countryBreakdown: text({ mode: "json" }).notNull().default({}),
    cityBreakdown: text({ mode: "json" }).notNull().default({}),
    sourceBreakdown: text({ mode: "json" }).notNull().default({}),

    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("idx_form_analytics_daily_form_id_date").on(t.formId, t.date)],
);

// ============================================================================
// Form Dropoff Daily Table (Question Drop-off Aggregates)
// ============================================================================
export const formDropoffDaily = sqliteTable(
  "form_dropoff_daily",
  {
    id: text().primaryKey(),
    formId: text().notNull(),
    date: text().notNull(),
    questionId: text().notNull(),
    questionIndex: integer().notNull(),

    viewCount: integer().notNull().default(0),
    startCount: integer().notNull().default(0),
    completeCount: integer().notNull().default(0),
    dropoffCount: integer().notNull().default(0),
    dropoffRate: integer(),
    completionRate: integer(),

    createdAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
    updatedAt: integer({ mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("idx_form_dropoff_daily_form_id_date").on(t.formId, t.date)],
);

// ============================================================================
// Upload Rate Limits (for public form file uploads)
// ============================================================================

export const uploadRateLimits = sqliteTable("upload_rate_limits", {
  ip: text("ip").primaryKey(),
  windowStart: integer("window_start", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
  count: integer("count").notNull().default(0),
});

// Drizzle v2 Relations using defineRelations
export const relations = defineRelations(
  {
    user,
    session,
    account,
    verification,
    todos,
    twoFactor,
    apikey,
    organization,
    member,
    invitation,
    forms,
    formVersions,
    workspaces,
    submissions,
    formVisits,
    formQuestionProgress,
    formAnalyticsDaily,
    formDropoffDaily,
    formFavorites,
    formNotificationPreferences,
    formSubmissionNotifications,
  },
  (r) => ({
    user: {
      sessions: r.many.session({ from: r.user.id, to: r.session.userId }),
      accounts: r.many.account({ from: r.user.id, to: r.account.userId }),
      twoFactors: r.many.twoFactor({ from: r.user.id, to: r.twoFactor.userId }),
      apikeys: r.many.apikey({ from: r.user.id, to: r.apikey.userId }),
      createdWorkspaces: r.many.workspaces({
        from: r.user.id,
        to: r.workspaces.createdByUserId,
      }),
      createdForms: r.many.forms({ from: r.user.id, to: r.forms.createdByUserId }),
      publishedVersions: r.many.formVersions({
        from: r.user.id,
        to: r.formVersions.publishedByUserId,
      }),
      members: r.many.member({ from: r.user.id, to: r.member.userId }),
      organizationMemberships: r.many.member({ from: r.user.id, to: r.member.userId }),
      favorites: r.many.formFavorites({ from: r.user.id, to: r.formFavorites.userId }),
      formNotificationPreferences: r.many.formNotificationPreferences({
        from: r.user.id,
        to: r.formNotificationPreferences.userId,
      }),
      formSubmissionNotifications: r.many.formSubmissionNotifications({
        from: r.user.id,
        to: r.formSubmissionNotifications.userId,
      }),
    },
    session: {
      user: r.one.user({ from: r.session.userId, to: r.user.id }),
    },
    account: {
      user: r.one.user({ from: r.account.userId, to: r.user.id }),
    },
    twoFactor: {
      user: r.one.user({ from: r.twoFactor.userId, to: r.user.id }),
    },
    apikey: {
      user: r.one.user({ from: r.apikey.userId, to: r.user.id }),
    },
    organization: {
      members: r.many.member({ from: r.organization.id, to: r.member.organizationId }),
      workspaces: r.many.workspaces({
        from: r.organization.id,
        to: r.workspaces.organizationId,
      }),
      invitations: r.many.invitation({
        from: r.organization.id,
        to: r.invitation.organizationId,
      }),
    },
    member: {
      user: r.one.user({ from: r.member.userId, to: r.user.id }),
      organization: r.one.organization({
        from: r.member.organizationId,
        to: r.organization.id,
      }),
    },
    invitation: {
      organization: r.one.organization({
        from: r.invitation.organizationId,
        to: r.organization.id,
      }),
    },
    workspaces: {
      organization: r.one.organization({
        from: r.workspaces.organizationId,
        to: r.organization.id,
      }),
      creator: r.one.user({ from: r.workspaces.createdByUserId, to: r.user.id }),
      forms: r.many.forms({ from: r.workspaces.id, to: r.forms.workspaceId }),
    },
    forms: {
      creator: r.one.user({ from: r.forms.createdByUserId, to: r.user.id }),
      workspace: r.one.workspaces({ from: r.forms.workspaceId, to: r.workspaces.id }),
      submissions: r.many.submissions({ from: r.forms.id, to: r.submissions.formId }),
      visits: r.many.formVisits({ from: r.forms.id, to: r.formVisits.formId }),
      analyticsDaily: r.many.formAnalyticsDaily({
        from: r.forms.id,
        to: r.formAnalyticsDaily.formId,
      }),
      dropoffDaily: r.many.formDropoffDaily({
        from: r.forms.id,
        to: r.formDropoffDaily.formId,
      }),
      versions: r.many.formVersions({ from: r.forms.id, to: r.formVersions.formId }),
      currentPublishedVersion: r.one.formVersions({
        from: r.forms.lastPublishedVersionId,
        to: r.formVersions.id,
      }),
      favorites: r.many.formFavorites({ from: r.forms.id, to: r.formFavorites.formId }),
      notificationPreferences: r.many.formNotificationPreferences({
        from: r.forms.id,
        to: r.formNotificationPreferences.formId,
      }),
      submissionNotifications: r.many.formSubmissionNotifications({
        from: r.forms.id,
        to: r.formSubmissionNotifications.formId,
      }),
    },
    formVersions: {
      form: r.one.forms({ from: r.formVersions.formId, to: r.forms.id }),
      publishedBy: r.one.user({
        from: r.formVersions.publishedByUserId,
        to: r.user.id,
      }),
    },
    submissions: {
      form: r.one.forms({ from: r.submissions.formId, to: r.forms.id }),
    },
    formVisits: {
      form: r.one.forms({ from: r.formVisits.formId, to: r.forms.id }),
      submission: r.one.submissions({
        from: r.formVisits.submissionId,
        to: r.submissions.id,
      }),
      questionProgress: r.many.formQuestionProgress({
        from: r.formVisits.id,
        to: r.formQuestionProgress.visitId,
      }),
    },
    formQuestionProgress: {
      form: r.one.forms({ from: r.formQuestionProgress.formId, to: r.forms.id }),
      visit: r.one.formVisits({
        from: r.formQuestionProgress.visitId,
        to: r.formVisits.id,
      }),
    },
    formAnalyticsDaily: {
      form: r.one.forms({ from: r.formAnalyticsDaily.formId, to: r.forms.id }),
    },
    formDropoffDaily: {
      form: r.one.forms({ from: r.formDropoffDaily.formId, to: r.forms.id }),
    },
    formFavorites: {
      user: r.one.user({ from: r.formFavorites.userId, to: r.user.id }),
      form: r.one.forms({ from: r.formFavorites.formId, to: r.forms.id }),
    },
    formNotificationPreferences: {
      user: r.one.user({
        from: r.formNotificationPreferences.userId,
        to: r.user.id,
      }),
      form: r.one.forms({
        from: r.formNotificationPreferences.formId,
        to: r.forms.id,
      }),
    },
    formSubmissionNotifications: {
      user: r.one.user({
        from: r.formSubmissionNotifications.userId,
        to: r.user.id,
      }),
      form: r.one.forms({
        from: r.formSubmissionNotifications.formId,
        to: r.forms.id,
      }),
    },
  }),
);

// ============================================================================
// Zod Schema Exports (Single Source of Truth)
// ============================================================================

export const WorkspaceZod = createSelectSchema(workspaces);
export const FormZod = createSelectSchema(forms);
export const FormVersionZod = createSelectSchema(formVersions);
export const SubmissionZod = createSelectSchema(submissions);
export const FormVisitsZod = createSelectSchema(formVisits);
export const FormQuestionProgressZod = createSelectSchema(formQuestionProgress);
export const FormAnalyticsDailyZod = createSelectSchema(formAnalyticsDaily);
export const FormDropoffDailyZod = createSelectSchema(formDropoffDaily);

export const OrganizationZod = createSelectSchema(organization);
export const MemberZod = createSelectSchema(member);
export const InvitationZod = createSelectSchema(invitation);

export const FormFavoriteZod = createSelectSchema(formFavorites);
export const FormNotificationPreferenceZod = createSelectSchema(formNotificationPreferences);
export const FormSubmissionNotificationZod = createSelectSchema(formSubmissionNotifications);
