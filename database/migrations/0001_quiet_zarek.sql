CREATE TABLE `access_log_environment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`access_log_id` integer NOT NULL,
	`environment_key` text NOT NULL,
	`environment_value` text NOT NULL,
	`environment_type` text DEFAULT 'string',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `permission_conditions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`permission_id` integer NOT NULL,
	`attribute_path` text NOT NULL,
	`operator` text NOT NULL,
	`value` text NOT NULL,
	`value_type` text DEFAULT 'string',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `policy_audit_details` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`audit_log_id` integer NOT NULL,
	`detail_type` text NOT NULL,
	`detail_key` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`value_type` text DEFAULT 'string',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `policy_conditions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_id` text NOT NULL,
	`attribute_path` text NOT NULL,
	`operator` text NOT NULL,
	`value` text NOT NULL,
	`value_type` text DEFAULT 'string',
	`logical_operator` text DEFAULT 'AND',
	`condition_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `policy_targets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_id` text NOT NULL,
	`resource_type` text,
	`resource_id` text,
	`action` text NOT NULL,
	`target_order` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `access_logs` ADD `session_id` text;--> statement-breakpoint
ALTER TABLE `access_logs` ADD `request_method` text;--> statement-breakpoint
ALTER TABLE `access_logs` ADD `endpoint` text;--> statement-breakpoint
ALTER TABLE `access_logs` ADD `response_status` integer;--> statement-breakpoint
ALTER TABLE `access_logs` DROP COLUMN `environment`;--> statement-breakpoint
ALTER TABLE `policy_audit_logs` ADD `old_policy_name` text;--> statement-breakpoint
ALTER TABLE `policy_audit_logs` ADD `new_policy_name` text;--> statement-breakpoint
ALTER TABLE `policy_audit_logs` ADD `old_effect` text;--> statement-breakpoint
ALTER TABLE `policy_audit_logs` ADD `new_effect` text;--> statement-breakpoint
ALTER TABLE `policy_audit_logs` ADD `old_priority` integer;--> statement-breakpoint
ALTER TABLE `policy_audit_logs` ADD `new_priority` integer;--> statement-breakpoint
ALTER TABLE `policy_audit_logs` DROP COLUMN `old_value`;--> statement-breakpoint
ALTER TABLE `policy_audit_logs` DROP COLUMN `new_value`;--> statement-breakpoint
ALTER TABLE `abac_policies` DROP COLUMN `conditions`;--> statement-breakpoint
ALTER TABLE `abac_policies` DROP COLUMN `target`;--> statement-breakpoint
ALTER TABLE `permissions` DROP COLUMN `conditions`;