import { pgEnum, pgTable, timestamp, uuid, varchar, integer } from 'drizzle-orm/pg-core';
import { users } from './users';

export const transactionStatus = pgEnum('transaction_status', [
  'canceled',
  'failed',
  'posted',
  'created',
  'returned',
]);

export const transactions = pgTable('transactions', {
  id: uuid('transactionId').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id)
    .notNull(),
  stripeOutboundId: varchar('stripe_outbound_id', { length: 255 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency').notNull(),
  status: transactionStatus('transaction_status').default('created').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Tranaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type TransactionStatus = (typeof transactionStatus.enumValues)[number];
