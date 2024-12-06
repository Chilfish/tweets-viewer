CREATE TABLE IF NOT EXISTS "tweets" (
	"id" integer PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp NOT NULL,
	"full_text" text NOT NULL,
	"media" json DEFAULT '[]'::json NOT NULL,
	"in_reply_to" text,
	"retweeted_status" text,
	"quoted_status" text,
	"retweet_count" integer DEFAULT 0 NOT NULL,
	"quote_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"favorite_count" integer DEFAULT 0 NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"screen_name" text NOT NULL,
	"avatar_url" text NOT NULL,
	"profile_banner_url" text NOT NULL,
	"followers_count" integer NOT NULL,
	"following_count" integer NOT NULL,
	"bio" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"location" text,
	"website" text,
	"birthday" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tweets" ADD CONSTRAINT "tweets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
