ALTER TABLE "sales" ALTER COLUMN "shift_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "sales" ADD COLUMN "recorded_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;