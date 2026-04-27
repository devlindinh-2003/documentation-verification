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

export const roleEnum = pgEnum('role', ['seller', 'admin']);
export const statusEnum = pgEnum('status', [
  'pending',
  'processing',
  'verified',
  'rejected',
  'inconclusive',
  'approved',
  'denied',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verificationRecords = pgTable(
  'verification_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sellerId: uuid('seller_id')
      .notNull()
      .references(() => users.id),
    status: statusEnum('status').notNull().default('pending'),
    documentKey: text('document_key').notNull(),
    documentName: text('document_name').notNull(),
    documentSize: integer('document_size').notNull(),
    documentMime: text('document_mime').notNull(),
    externalJobId: text('external_job_id'),
    externalResult: text('external_result'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    reviewReason: text('review_reason'),
    lockedBy: uuid('locked_by').references(() => users.id),
    lockedAt: timestamp('locked_at'),
    notifiedAt: timestamp('notified_at'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('status_idx').on(table.status),
    index('seller_id_idx').on(table.sellerId),
    uniqueIndex('external_job_id_idx').on(table.externalJobId),
  ],
);

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
    actorRole: text('actor_role').notNull(),
    eventType: text('event_type').notNull(),
    fromStatus: text('from_status').notNull(),
    toStatus: text('to_status').notNull(),
    metadata: jsonb('metadata').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [index('record_id_idx').on(table.recordId)],
);

export const notificationTypeEnum = pgEnum('notification_type', [
  'VERIFICATION_RESULT',
]);

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
    metadata: jsonb('metadata').notNull(), // { recordId: string, status: string }
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('notif_user_id_idx').on(table.userId),
    // We will handle idempotency in the service layer since functional indexes on JSONB
    // are tricky to define in a portable way in Drizzle schemas without raw SQL.
  ],
);

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

export const verificationRecordsRelations = relations(
  verificationRecords,
  ({ one, many }) => ({
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
  }),
);

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
