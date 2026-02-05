import { relations } from 'drizzle-orm/relations';
import { users, accounts, events } from './schema.js';

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.dcid],
    references: [users.dcid],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  events: many(events),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.dcid],
    references: [users.dcid],
  }),
}));
