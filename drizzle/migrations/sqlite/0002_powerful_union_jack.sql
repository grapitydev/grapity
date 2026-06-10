CREATE TABLE `gateway_config_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`gateway_config_id` text NOT NULL,
	`routes` text NOT NULL,
	`environments` text NOT NULL,
	`content` text NOT NULL,
	`checksum` text NOT NULL,
	`pushed_by` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`gateway_config_id`) REFERENCES `gateway_configs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_gateway_config_versions_config_id` ON `gateway_config_versions` (`gateway_config_id`);--> statement-breakpoint
CREATE TABLE `gateway_configs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`provider` text NOT NULL,
	`spec_name` text NOT NULL,
	`spec_semver` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gateway_configs_name_unique` ON `gateway_configs` (`name`);--> statement-breakpoint
CREATE TABLE `provisions` (
	`id` text PRIMARY KEY NOT NULL,
	`gateway_config_name` text NOT NULL,
	`gateway_config_version` text NOT NULL,
	`environment` text NOT NULL,
	`provider` text NOT NULL,
	`synced` integer DEFAULT false NOT NULL,
	`actor` text NOT NULL,
	`details` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_provisions_config_name` ON `provisions` (`gateway_config_name`);--> statement-breakpoint
CREATE INDEX `idx_provisions_created_at` ON `provisions` (`created_at`);