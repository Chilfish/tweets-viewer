CREATE TABLE "tweets" (
	"id" serial PRIMARY KEY NOT NULL,
	"tweetId" text NOT NULL,
	"userName" text NOT NULL,
	"fullText" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"jsonData" json NOT NULL,
	CONSTRAINT "tweets_tweetId_unique" UNIQUE("tweetId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"restId" text NOT NULL,
	"userName" text NOT NULL,
	"jsonData" json NOT NULL,
	CONSTRAINT "users_userName_unique" UNIQUE("userName")
);
--> statement-breakpoint
ALTER TABLE "tweets" ADD CONSTRAINT "tweets_userName_users_userName_fk" FOREIGN KEY ("userName") REFERENCES "public"."users"("userName") ON DELETE cascade ON UPDATE no action;