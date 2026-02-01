import { relations } from "drizzle-orm/relations";
import { users, skport, events } from "./schema";

export const skportRelations = relations(skport, ({one}) => ({
	user: one(users, {
		fields: [skport.dcid],
		references: [users.dcid]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	skports: many(skport),
	events: many(events),
}));

export const eventsRelations = relations(events, ({one}) => ({
	user: one(users, {
		fields: [events.dcid],
		references: [users.dcid]
	}),
}));