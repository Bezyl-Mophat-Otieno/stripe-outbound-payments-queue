CREATE TYPE "public"."transaction_status" AS ENUM('cancelled', 'failed', 'posted', 'created', 'returned');--> statement-breakpoint
CREATE TABLE "transactions" (
	"transactionId" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"outbound_id" varchar(255),
	"amount" integer NOT NULL,
	"currency" varchar NOT NULL,
	"transaction_status" "transaction_status" DEFAULT 'created' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_stripe_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."stripe_users"("id") ON DELETE no action ON UPDATE no action;