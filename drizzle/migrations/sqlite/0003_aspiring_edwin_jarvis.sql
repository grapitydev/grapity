CREATE TABLE `http_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text NOT NULL,
	`gateway_config_name` text NOT NULL,
	`environment` text NOT NULL,
	`method` text NOT NULL,
	`path` text NOT NULL,
	`route_path` text,
	`status` integer NOT NULL,
	`caller_id` text,
	`caller_source` text,
	`caller_confidence` text NOT NULL,
	`occurred_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_http_logs_config_env` ON `http_logs` (`gateway_config_name`,`environment`);--> statement-breakpoint
CREATE INDEX `idx_http_logs_occurred_at` ON `http_logs` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `idx_http_logs_caller` ON `http_logs` (`gateway_config_name`,`environment`,`caller_id`);--> statement-breakpoint
ALTER TABLE `gateway_config_versions` ADD `caller_identification` text;