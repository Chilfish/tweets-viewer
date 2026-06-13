CREATE TABLE "ins_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"jsonData" json NOT NULL,
	CONSTRAINT "ins_posts_post_id_unique" UNIQUE("post_id")
);
--> statement-breakpoint
CREATE TABLE "ins_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"jsonData" json NOT NULL,
	CONSTRAINT "ins_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "ins_posts" ADD CONSTRAINT "ins_posts_username_ins_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."ins_users"("username") ON DELETE cascade ON UPDATE no action;