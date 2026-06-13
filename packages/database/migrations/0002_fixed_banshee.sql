CREATE TABLE "ins_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"jsonData" json NOT NULL,
	CONSTRAINT "ins_posts_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ins_username" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ins_json_data" json;--> statement-breakpoint
ALTER TABLE "ins_posts" ADD CONSTRAINT "ins_posts_username_users_userName_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("userName") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_ins_username_unique" UNIQUE("ins_username");