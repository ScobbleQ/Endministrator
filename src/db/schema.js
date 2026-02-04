import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  foreignKey,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const accounts = pgTable(
  'accounts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    dcid: text().notNull(),
    addedOn: timestamp('added_on', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    nickname: text().notNull(),
    accountToken: text('account_token').notNull(),
    hgId: text('hg_id').notNull(),
    userId: text('user_id').notNull(),
    roleId: text('role_id').notNull(),
    channelId: text('channel_id').notNull(),
    serverType: text('server_type').notNull(),
    serverId: text('server_id').notNull(),
    serverName: text('server_name').notNull(),
    isPrivate: boolean('is_private').default(false).notNull(),
    enableNotif: boolean('enable_notif').default(true).notNull(),
    enableSignin: boolean('enable_signin').default(true).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.dcid],
      foreignColumns: [users.dcid],
      name: 'accounts_dcid_fkey',
    })
      .onUpdate('cascade')
      .onDelete('cascade'),
  ]
);

export const users = pgTable('users', {
  dcid: text().primaryKey().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
  isBanned: boolean('is_banned').default(false).notNull(),
});

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
