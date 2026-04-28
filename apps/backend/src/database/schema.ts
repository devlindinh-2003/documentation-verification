import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

/**
 * Global roles for users.
 */
export const roleEnum = pgEnum('role', ['seller', 'admin']);

/**
 * Statuses for verification records.
 * Terminal states: verified, rejected, approved, denied.
 * Transitional states: pending, processing, inconclusive.
 */
export const statusEnum = pgEnum('status', [
  'pending',
  'processing',
  'verified',
  'rejected',
  'inconclusive',
  'approved',
  'denied',
]);

/**
 * Users table stores both sellers and admins.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  isDemo: boolean('is_demo').notNull().default(false), // Flag for volatile demo accounts
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

/**
 * Verification records track the lifecycle of a document verification request.
 */
export const verificationRecords = pgTable(
  'verification_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id),
    status: statusEnum('status').notNull().default('pending'),
    documentKey: text('document_key').notNull(), // S3/Storage key
    documentName: text('document_name').notNull(),
    documentSize: integer('document_size').notNull(),
    documentMime: text('document_mime').notNull(),
    externalJobId: text('external_job_id'), // Correlation ID for BullMQ/External providers
    externalResult: text('external_result'),
    reviewedBy: uuid('reviewed_by').references(() => users.id), // Admin who made the final decision
    reviewReason: text('review_reason'),
    lockedBy: uuid('locked_by').references(() => users.id), // Soft lock for admin review
    lockedAt: timestamp('locked_at'),
    notifiedAt: timestamp('notified_at'),
    version: integer('version').notNull().default(1), // Used for optimistic concurrency control
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('status_idx').on(table.status),
    index('seller_id_idx').on(table.sellerId),
    uniqueIndex('external_job_id_idx').on(table.externalJobId),
  ],
);

/**
 * Audit events table provides an immutable history of all state changes.
 */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recordId: uuid('record_id')
      .notNull()
      .references(() => verificationRecords.id),
    actorId: uuid('actor_id')
      .notNull()
      .references(() => users.id),
    actorRole: text('actor_role').notNull(), // Snapshot of role at time of event
    eventType: text('event_type').notNull(),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    metadata: jsonb('metadata').notNull(), // Context-specific data (e.g., job IDs, failure reasons)
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('record_id_idx').on(table.recordId)],
);

export const notificationTypeEnum = pgEnum('notification_type', ['VERIFICATION_RESULT']);

/**
 * Notifications table for in-app alerts to users.
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    title: text('title').notNull(),
    body: text('body').notNull(),
    type: notificationTypeEnum('type').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    readAt: timestamp('read_at'),
    metadata: jsonb('metadata').notNull(), // e.g., { recordId: string, status: string }
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('notif_user_id_idx').on(table.userId)],
);

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  verificationRecords: many(verificationRecords, {
    relationName: 'sellerRecords',
  }),
  reviewedRecords: many(verificationRecords, {
    relationName: 'reviewedRecords',
  }),
  lockedRecords: many(verificationRecords, { relationName: 'lockedRecords' }),
  auditEvents: many(auditEvents),
  notifications: many(notifications),
}));

export const verificationRecordsRelations = relations(verificationRecords, ({ one, many }) => ({
  seller: one(users, {
    fields: [verificationRecords.sellerId],
    references: [users.id],
    relationName: 'sellerRecords',
  }),
  reviewer: one(users, {
    fields: [verificationRecords.reviewedBy],
    references: [users.id],
    relationName: 'reviewedRecords',
  }),
  locker: one(users, {
    fields: [verificationRecords.lockedBy],
    references: [users.id],
    relationName: 'lockedRecords',
  }),
  auditEvents: many(auditEvents),
}));

export const auditEventsRelations = relations(auditEvents, ({ one }) => ({
  record: one(verificationRecords, {
    fields: [auditEvents.recordId],
    references: [verificationRecords.id],
  }),
  actor: one(users, { fields: [auditEvents.actorId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
