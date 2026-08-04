CREATE TABLE "sale_note_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"note_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"item_name" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sale_note_items" ADD CONSTRAINT "sale_note_items_note_id_sale_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."sale_notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_note_items" ADD CONSTRAINT "sale_note_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_notes" DROP COLUMN "item_name";--> statement-breakpoint
ALTER TABLE "sale_notes" DROP COLUMN "quantity";