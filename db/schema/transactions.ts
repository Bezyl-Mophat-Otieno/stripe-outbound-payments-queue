import { pgEnum, pgTable, uuid, varchar } from 'drizzle-orm/pg-core';

const transactionStatus = pgEnum("transaction_status", [''])

export const users = pgTable('stripe_users', {
  id: uuid('transactionId').defaultRandom().primaryKey(),
  outboundId: varchar('outbound_id', { length: 255 }).notNull(),
  status: transactionStatus('transaction_status').notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
