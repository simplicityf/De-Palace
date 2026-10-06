ALTER TABLE "items" ADD COLUMN "cost_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "cost_price_at_sale" numeric(10, 2);