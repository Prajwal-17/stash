CREATE TABLE "bookmark_to_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"bookmark_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bookmarks" ALTER COLUMN "description" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "tag_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "hostname" varchar(255);--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "root_domain" varchar(255);--> statement-breakpoint
ALTER TABLE "bookmark_to_tags" ADD CONSTRAINT "bookmark_to_tags_bookmark_id_bookmarks_id_fk" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmarks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_to_tags" ADD CONSTRAINT "bookmark_to_tags_tag_id_bookmarks_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."bookmarks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookmark_tag_unique" ON "bookmark_to_tags" USING btree ("bookmark_id","tag_id");--> statement-breakpoint
CREATE INDEX "bookmark_id_idx" ON "bookmark_to_tags" USING btree ("bookmark_id");--> statement-breakpoint
CREATE INDEX "tag_id_idx" ON "bookmark_to_tags" USING btree ("tag_id");--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;