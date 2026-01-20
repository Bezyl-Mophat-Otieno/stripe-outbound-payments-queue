ALTER TABLE "users" RENAME TO "stripe_users";--> statement-breakpoint
ALTER TABLE "stripe_users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "stripe_users" ADD CONSTRAINT "stripe_users_email_unique" UNIQUE("email");