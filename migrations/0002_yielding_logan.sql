CREATE TYPE "public"."queue_status" AS ENUM('enqueued', 'processing', 'dequeued', 'failed');--> statement-breakpoint
CREATE TABLE "stripe_payments_queue" (
	"queueId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queue_status" "queue_status" DEFAULT 'enqueued',
	"stripe_outbound_id" varchar,
	"payload" jsonb NOT NULL,
	"retries" integer DEFAULT 0 NOT NULL,
	"last_failure_message" text,
	"ttl" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "stripe_users" ALTER COLUMN "id" SET DATA TYPE uuid USING id::uuid;--> statement-breakpoint
ALTER TABLE "stripe_users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();