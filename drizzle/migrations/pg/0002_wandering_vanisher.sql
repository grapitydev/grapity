CREATE TABLE "gateway_config_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"gateway_config_id" text NOT NULL,
	"routes" jsonb NOT NULL,
	"environments" jsonb NOT NULL,
	"content" text NOT NULL,
	"checksum" text NOT NULL,
	"pushed_by" text,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gateway_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"spec_name" text NOT NULL,
	"spec_semver" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "gateway_configs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "provisions" (
	"id" text PRIMARY KEY NOT NULL,
	"gateway_config_name" text NOT NULL,
	"gateway_config_version" text NOT NULL,
	"environment" text NOT NULL,
	"provider" text NOT NULL,
	"synced" boolean DEFAULT false NOT NULL,
	"actor" text NOT NULL,
	"details" jsonb,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gateway_config_versions" ADD CONSTRAINT "gateway_config_versions_gateway_config_id_gateway_configs_id_fk" FOREIGN KEY ("gateway_config_id") REFERENCES "public"."gateway_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gateway_config_versions_config_id" ON "gateway_config_versions" USING btree ("gateway_config_id");--> statement-breakpoint
CREATE INDEX "idx_provisions_config_name" ON "provisions" USING btree ("gateway_config_name");--> statement-breakpoint
CREATE INDEX "idx_provisions_created_at" ON "provisions" USING btree ("created_at");