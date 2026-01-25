import {
  pgTable,
  text,
  uuid,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  varchar,
} from 'drizzle-orm/pg-core';
import z from 'zod';

export const enqueueSchema = z.object({
  from: z.string().min(1, 'From account is required'),
  to: z.string().min(1, 'To account is required'),
  amount: z.number(),
  Currency: z.enum(['usd', 'kes']),
});

export type PaymentDetails = z.infer<typeof enqueueSchema>;
export const queueStatus = pgEnum('queue_status', ['enqueued', 'processing', 'dequeued', 'failed']);

export const stripePaymentsQueue = pgTable('stripe_payments_queue', {
  queueId: uuid('queueId').defaultRandom().primaryKey(),
  status: queueStatus('queue_status').default('enqueued'),
  stripeOutboundId: varchar('stripe_outbound_id'),
  metadata: jsonb('payload').$type<PaymentDetails>().notNull(),
  retries: integer('retries').default(0).notNull(),
  lastFailureMessage: text('last_failure_message'),
  ttl: timestamp('ttl', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
});
export type EnqueuedStripeItem = typeof stripePaymentsQueue.$inferSelect;
export type NewEnqueuedStripeItem = typeof stripePaymentsQueue.$inferInsert;
