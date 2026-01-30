import {
  bigint,
  boolean,
  foreignKey,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  dcid: text().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  isPrivate: boolean('is_private').default(false).notNull(),
  notifyAttendance: boolean('notify_attendance').default(true).notNull(),
  enableAttendance: boolean('enable_attendance').default(true).notNull(),
});

export const skport = pgTable(
  'skport',
  {
    dcid: text().primaryKey().notNull(),
    userId: text('user_id').notNull(),
    cred: text().notNull(),
    token: text().notNull(),
    serverId: text('server_id').notNull(),
    roleId: text('role_id').notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.dcid],
      foreignColumns: [users.dcid],
      name: 'cred_dcid_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
    unique('cred_dcid_key').on(table.dcid),
  ]
);

export const events = pgTable(
  'events',
  {
    dcid: text().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
      .defaultNow()
      .notNull(),
    interaction: text().notNull(),
    metadata: jsonb(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity({
      name: 'events_id_seq',
      startWith: 1,
      increment: 1,
      minValue: 1,
      maxValue: 9223372036854775807,
      cache: 1,
    }),
  },
  (table) => [
    foreignKey({
      columns: [table.dcid],
      foreignColumns: [users.dcid],
      name: 'events_dcid_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);
