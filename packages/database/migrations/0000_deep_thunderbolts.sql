CREATE TABLE IF NOT EXISTS "tweets" (
  "id" serial PRIMARY KEY NOT NULL,
  "tweet_id" text NOT NULL,
  "user_name" text NOT NULL,
  "created_at" timestamp NOT NULL,
  "full_text" text NOT NULL,
  "media" json DEFAULT '[]'::json NOT NULL,
  "retweet_count" integer DEFAULT 0 NOT NULL,
  "quote_count" integer DEFAULT 0 NOT NULL,
  "reply_count" integer DEFAULT 0 NOT NULL,
  "favorite_count" integer DEFAULT 0 NOT NULL,
  "views_count" integer DEFAULT 0 NOT NULL,
  "retweeted_status" json,
  "quoted_status" json,
  CONSTRAINT "tweets_tweet_id_unique" UNIQUE("tweet_id")
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
  "birthday" timestamp,
  "tweet_start" timestamp DEFAULT now() NOT NULL,
  "tweet_end" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "users_screen_name_unique" UNIQUE("screen_name")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tweets" ADD CONSTRAINT "tweets_user_name_users_screen_name_fk" FOREIGN KEY ("user_name") REFERENCES "public"."users"("screen_name") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tweet_id_idx" ON "tweets" USING btree ("tweet_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "created_at_idx" ON "tweets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "text_idx" ON "tweets" USING btree ("full_text");
