CREATE TABLE `abac_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`effect` text NOT NULL,
	`conditions` text NOT NULL,
	`priority` integer DEFAULT 0,
	`is_active` integer DEFAULT true,
	`target` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `access_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`resource_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`action` text NOT NULL,
	`decision` text NOT NULL,
	`reason` text,
	`policy_id` text,
	`rbac_granted` integer,
	`abac_granted` integer,
	`environment` text,
	`ip_address` text,
	`user_agent` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`resource` text NOT NULL,
	`action` text NOT NULL,
	`conditions` text,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `policy_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`policy_id` text NOT NULL,
	`action` text NOT NULL,
	`changed_by` integer NOT NULL,
	`old_value` text,
	`new_value` text,
	`reason` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `resource_attributes` (
	`resource_id` text NOT NULL,
	`resource_type` text NOT NULL,
	`attribute_key` text NOT NULL,
	`attribute_value` text NOT NULL,
	`attribute_type` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `role_audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`role_id` integer NOT NULL,
	`action` text NOT NULL,
	`changed_by` integer NOT NULL,
	`reason` text,
	`expires_at` text,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `role_permissions` (
	`role_id` integer NOT NULL,
	`permission_id` integer NOT NULL,
	`granted_at` text DEFAULT CURRENT_TIMESTAMP,
	`granted_by` integer
);
--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`hierarchy_level` integer DEFAULT 1,
	`parent_role_id` integer,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `user_attributes` (
	`user_id` integer NOT NULL,
	`attribute_key` text NOT NULL,
	`attribute_value` text NOT NULL,
	`attribute_type` text NOT NULL,
	`is_active` integer DEFAULT true,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `user_roles` (
	`user_id` integer NOT NULL,
	`role_id` integer NOT NULL,
	`assigned_at` text DEFAULT CURRENT_TIMESTAMP,
	`assigned_by` integer,
	`expires_at` text,
	`is_active` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	`is_active` integer DEFAULT true,
	`last_login` text,
	`department` text,
	`location` text,
	`clearance_level` text DEFAULT 'standard',
	`account_status` text DEFAULT 'active'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);