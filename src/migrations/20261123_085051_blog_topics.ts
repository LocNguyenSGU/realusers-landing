import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_topics_status" AS ENUM('cho-viet', 'dang-viet', 'da-viet', 'bo');
  CREATE TABLE "topics" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"keyword" varchar NOT NULL,
  	"title" varchar,
  	"supporting_keywords" varchar,
  	"notes" varchar,
  	"keyword_en" varchar,
  	"title_en" varchar,
  	"publish_on" timestamp(3) with time zone,
  	"status" "enum_topics_status" DEFAULT 'cho-viet' NOT NULL,
  	"category_id" integer,
  	"post_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_list_topics" boolean DEFAULT true;
  ALTER TABLE "payload_mcp_api_keys" ADD COLUMN "payload_mcp_tool_save_topic" boolean DEFAULT true;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "topics_id" integer;
  ALTER TABLE "topics" ADD CONSTRAINT "topics_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "topics" ADD CONSTRAINT "topics_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "topics_publish_on_idx" ON "topics" USING btree ("publish_on");
  CREATE INDEX "topics_status_idx" ON "topics" USING btree ("status");
  CREATE INDEX "topics_category_idx" ON "topics" USING btree ("category_id");
  CREATE INDEX "topics_post_idx" ON "topics" USING btree ("post_id");
  CREATE INDEX "topics_updated_at_idx" ON "topics" USING btree ("updated_at");
  CREATE INDEX "topics_created_at_idx" ON "topics" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_topics_fk" FOREIGN KEY ("topics_id") REFERENCES "public"."topics"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_topics_id_idx" ON "payload_locked_documents_rels" USING btree ("topics_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "topics" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "topics" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_topics_fk";
  
  DROP INDEX "payload_locked_documents_rels_topics_id_idx";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_list_topics";
  ALTER TABLE "payload_mcp_api_keys" DROP COLUMN "payload_mcp_tool_save_topic";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "topics_id";
  DROP TYPE "public"."enum_topics_status";`)
}
