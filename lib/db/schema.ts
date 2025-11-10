import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ================================
// EXISTING USER TABLE (Enhanced)
// ================================

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(), // Added for authentication
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastLogin: text('last_login'),
  // ABAC User Attributes
  department: text('department'),
  location: text('location'),
  clearanceLevel: text('clearance_level').default('standard'),
  accountStatus: text('account_status').default('active'), // active, suspended, terminated
});

// ================================
// RBAC TABLES (Unchanged)
// ================================

// Roles table with hierarchical support
export const roles = sqliteTable('roles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  hierarchy_level: integer('hierarchy_level').default(1),
  parent_role_id: integer('parent_role_id'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Permissions table (NORMALIZED - removed conditions field)
export const permissions = sqliteTable('permissions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Permission conditions table (NORMALIZED from permissions.conditions)
export const permission_conditions = sqliteTable('permission_conditions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  permission_id: integer('permission_id').notNull(),
  attribute_path: text('attribute_path').notNull(), // e.g., "user.department", "user.clearanceLevel"
  operator: text('operator').notNull(),             // e.g., "equals", "contains", "greater_than", "in"
  value: text('value').notNull(),                  // stored as text, parsed based on operator
  value_type: text('value_type').default('string'), // string, number, boolean, array
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Role-Permission mapping table
export const role_permissions = sqliteTable('role_permissions', {
  role_id: integer('role_id').notNull(),
  permission_id: integer('permission_id').notNull(),
  granted_at: text('granted_at').default(sql`CURRENT_TIMESTAMP`),
  granted_by: integer('granted_by'),
  // Composite primary key will be defined separately
});

// User-Role assignment table
export const user_roles = sqliteTable('user_roles', {
  user_id: integer('user_id').notNull(),
  role_id: integer('role_id').notNull(),
  assigned_at: text('assigned_at').default(sql`CURRENT_TIMESTAMP`),
  assigned_by: integer('assigned_by'),
  expires_at: text('expires_at'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  // Composite primary key will be defined separately
});

// ================================
// ABAC TABLES (NORMALIZED)
// ================================

// ABAC Policies table (NORMALIZED - removed conditions and target fields)
export const abac_policies = sqliteTable('abac_policies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  effect: text('effect').notNull(), // "allow" or "deny"
  priority: integer('priority').default(0),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updated_at: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Policy conditions table (NORMALIZED from abac_policies.conditions)
export const policy_conditions = sqliteTable('policy_conditions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  policy_id: text('policy_id').notNull(),
  attribute_path: text('attribute_path').notNull(), // e.g., "user.department", "user.accountStatus"
  operator: text('operator').notNull(),             // e.g., "equals", "not_equals", "in", "not_in", "greater_than"
  value: text('value').notNull(),                  // stored as text, parsed based on operator
  value_type: text('value_type').default('string'), // string, number, boolean, array
  logical_operator: text('logical_operator').default('AND'), // AND, OR
  condition_order: integer('condition_order').default(0),    // for ordering conditions
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Policy targets table (NORMALIZED from abac_policies.target)
export const policy_targets = sqliteTable('policy_targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  policy_id: text('policy_id').notNull(),
  resource_type: text('resource_type'),           // specific resource type or '*' for all
  resource_id: text('resource_id'),              // specific resource ID or '*' for all
  action: text('action').notNull(),              // specific action or '*' for all
  target_order: integer('target_order').default(0), // for ordering targets
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// User Attributes table for ABAC (unchanged)
export const user_attributes = sqliteTable('user_attributes', {
  user_id: integer('user_id').notNull(),
  attribute_key: text('attribute_key').notNull(),
  attribute_value: text('attribute_value').notNull(),
  attribute_type: text('attribute_type').notNull(), // string, number, boolean, date, json
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  // Composite primary key will be defined separately
});

// Resource Attributes table for ABAC (unchanged)
export const resource_attributes = sqliteTable('resource_attributes', {
  resource_id: text('resource_id').notNull(),
  resource_type: text('resource_type').notNull(),
  attribute_key: text('attribute_key').notNull(),
  attribute_value: text('attribute_value').notNull(),
  attribute_type: text('attribute_type').notNull(), // string, number, boolean, date, json
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  // Composite primary key will be defined separately
});

// ================================
// AUDIT AND LOGGING TABLES (NORMALIZED)
// ================================

// Access control audit logs (NORMALIZED - removed environment JSON)
export const access_logs = sqliteTable('access_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id'),
  resource_id: text('resource_id').notNull(),
  resource_type: text('resource_type').notNull(),
  action: text('action').notNull(),
  decision: text('decision').notNull(), // allow or deny
  reason: text('reason'), // Why the decision was made
  policy_id: text('policy_id'), // Which policy caused the decision
  rbac_granted: integer('rbac_granted', { mode: 'boolean' }), // Whether RBAC allowed it
  abac_granted: integer('abac_granted', { mode: 'boolean' }), // Whether ABAC allowed it
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  session_id: text('session_id'),
  request_method: text('request_method'),
  endpoint: text('endpoint'),
  response_status: integer('response_status'),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

// Access log environment details (NORMALIZED from access_logs.environment)
export const access_log_environment = sqliteTable('access_log_environment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  access_log_id: integer('access_log_id').notNull(),
  environment_key: text('environment_key').notNull(),  // e.g., "time", "location", "device_type"
  environment_value: text('environment_value').notNull(), // stored as text
  environment_type: text('environment_type').default('string'), // string, number, boolean
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Policy change audit logs (NORMALIZED - removed JSON fields)
export const policy_audit_logs = sqliteTable('policy_audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  policy_id: text('policy_id').notNull(),
  action: text('action').notNull(), // create, update, delete, activate, deactivate
  changed_by: integer('changed_by').notNull(),
  reason: text('reason'), // Why the change was made
  old_policy_name: text('old_policy_name'),
  new_policy_name: text('new_policy_name'),
  old_effect: text('old_effect'),
  new_effect: text('new_effect'),
  old_priority: integer('old_priority'),
  new_priority: integer('new_priority'),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

// Policy audit log details (NORMALIZED from policy_audit_logs JSON fields)
export const policy_audit_details = sqliteTable('policy_audit_details', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  audit_log_id: integer('audit_log_id').notNull(),
  detail_type: text('detail_type').notNull(), // "condition", "target", "property"
  detail_key: text('detail_key').notNull(),   // e.g., "conditions[0].attribute", "target.resource"
  old_value: text('old_value'),
  new_value: text('new_value'),
  value_type: text('value_type').default('string'),
  created_at: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Role assignment audit logs (unchanged)
export const role_audit_logs = sqliteTable('role_audit_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  user_id: integer('user_id').notNull(),
  role_id: integer('role_id').notNull(),
  action: text('action').notNull(), // assign, revoke, expire
  changed_by: integer('changed_by').notNull(),
  reason: text('reason'),
  expires_at: text('expires_at'),
  timestamp: text('timestamp').default(sql`CURRENT_TIMESTAMP`),
});

// ================================
// INDEXES FOR PERFORMANCE (ENHANCED)
// ================================

// RBAC Performance Indexes
export const idxUserRolesActive = sql`CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, is_active)`;
export const idxRolePermissionsActive = sql`CREATE INDEX IF NOT EXISTS idx_role_permissions_active ON role_permissions(role_id, permission_id)`;
export const idxRolesHierarchy = sql`CREATE INDEX IF NOT EXISTS idx_roles_hierarchy ON roles(parent_role_id, hierarchy_level)`;
export const idxPermissionsResourceAction = sql`CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action, is_active)`;

// NEW: Permission Conditions Indexes
export const idxPermissionConditionsPermission = sql`CREATE INDEX IF NOT EXISTS idx_permission_conditions_permission ON permission_conditions(permission_id)`;
export const idxPermissionConditionsAttribute = sql`CREATE INDEX IF NOT EXISTS idx_permission_conditions_attribute ON permission_conditions(attribute_path, operator)`;

// ABAC Performance Indexes (ENHANCED)
export const idxAbacPoliciesActive = sql`CREATE INDEX IF NOT EXISTS idx_abac_policies_active ON abac_policies(is_active, priority)`;
export const idxPolicyConditionsPolicy = sql`CREATE INDEX IF NOT EXISTS idx_policy_conditions_policy ON policy_conditions(policy_id, condition_order)`;
export const idxPolicyConditionsAttribute = sql`CREATE INDEX IF NOT EXISTS idx_policy_conditions_attribute ON policy_conditions(attribute_path, operator)`;
export const idxPolicyTargetsPolicy = sql`CREATE INDEX IF NOT EXISTS idx_policy_targets_policy ON policy_targets(policy_id, target_order)`;
export const idxPolicyTargetsResourceAction = sql`CREATE INDEX IF NOT EXISTS idx_policy_targets_resource_action ON policy_targets(resource_type, resource_id, action)`;
export const idxUserAttributesKey = sql`CREATE INDEX IF NOT EXISTS idx_user_attributes_key ON user_attributes(user_id, attribute_key, is_active)`;
export const idxResourceAttributesKey = sql`CREATE INDEX IF NOT EXISTS idx_resource_attributes_key ON resource_attributes(resource_id, attribute_key)`;
export const idxResourceAttributesType = sql`CREATE INDEX IF NOT EXISTS idx_resource_attributes_type ON resource_attributes(resource_type)`;

// Audit Performance Indexes (ENHANCED)
export const idxAccessLogsUser = sql`CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id, timestamp)`;
export const idxAccessLogsResource = sql`CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON access_logs(resource_id, action, timestamp)`;
export const idxAccessLogsDecision = sql`CREATE INDEX IF NOT EXISTS idx_access_logs_decision ON access_logs(decision, timestamp)`;
export const idxAccessLogEnvironmentLogId = sql`CREATE INDEX IF NOT EXISTS idx_access_log_environment_log_id ON access_log_environment(access_log_id)`;
export const idxAccessLogEnvironmentKey = sql`CREATE INDEX IF NOT EXISTS idx_access_log_environment_key ON access_log_environment(environment_key, environment_value)`;
export const idxPolicyAuditLogs = sql`CREATE INDEX IF NOT EXISTS idx_policy_audit_logs ON policy_audit_logs(policy_id, timestamp)`;
export const idxPolicyAuditDetailsLogId = sql`CREATE INDEX IF NOT EXISTS idx_policy_audit_details_log_id ON policy_audit_details(audit_log_id)`;
export const idxRoleAuditLogs = sql`CREATE INDEX IF NOT EXISTS idx_role_audit_logs ON role_audit_logs(user_id, role_id, timestamp)`;

// ================================
// COMPOSITE PRIMARY KEYS
// ================================

// Role-Permission mapping composite primary key
export const rolePermissionsPk = sql`CREATE UNIQUE INDEX IF NOT EXISTS pk_role_permissions ON role_permissions(role_id, permission_id)`;

// User-Role assignment composite primary key
export const userRolesPk = sql`CREATE UNIQUE INDEX IF NOT EXISTS pk_user_roles ON user_roles(user_id, role_id)`;

// User Attributes composite primary key
export const userAttributesPk = sql`CREATE UNIQUE INDEX IF NOT EXISTS pk_user_attributes ON user_attributes(user_id, attribute_key)`;

// Resource Attributes composite primary key
export const resourceAttributesPk = sql`CREATE UNIQUE INDEX IF NOT EXISTS pk_resource_attributes ON resource_attributes(resource_id, attribute_key)`;

// NEW: Permission Conditions composite primary key
export const permissionConditionsPk = sql`CREATE UNIQUE INDEX IF NOT EXISTS pk_permission_conditions ON permission_conditions(permission_id, attribute_path, operator)`;

// NEW: Policy Conditions composite primary key
export const policyConditionsPk = sql`CREATE UNIQUE INDEX IF NOT EXISTS pk_policy_conditions ON policy_conditions(policy_id, condition_order)`;

// NEW: Policy Targets composite primary key
export const policyTargetsPk = sql`CREATE UNIQUE INDEX IF NOT EXISTS pk_policy_targets ON policy_targets(policy_id, target_order)`;

// NEW: Access Log Environment composite primary key
export const accessLogEnvironmentPk = sql`CREATE UNIQUE INDEX IF NOT EXISTS pk_access_log_environment ON access_log_environment(access_log_id, environment_key)`;

// NEW: Policy Audit Details composite primary key
export const policyAuditDetailsPk = sql`CREATE UNIQUE INDEX IF NOT EXISTS pk_policy_audit_details ON policy_audit_details(audit_log_id, detail_type, detail_key)`;

// ================================
// FOREIGN KEY CONSTRAINTS
// ================================

// Note: SQLite foreign key constraints need to be enabled at connection level

/*
FOREIGN KEY CONSTRAINTS (Enhanced):

users.id <- roles.parent_role_id
users.id <- role_permissions.granted_by
users.id <- user_roles.user_id
users.id <- user_roles.assigned_by
users.id <- access_logs.user_id
users.id <- policy_audit_logs.changed_by
users.id <- role_audit_logs.user_id
users.id <- role_audit_logs.changed_by

roles.id <- role_permissions.role_id
roles.id <- user_roles.role_id

permissions.id <- role_permissions.permission_id
permissions.id <- permission_conditions.permission_id

abac_policies.id <- policy_conditions.policy_id
abac_policies.id <- policy_targets.policy_id
abac_policies.id <- access_logs.policy_id

access_logs.id <- access_log_environment.access_log_id
policy_audit_logs.id <- policy_audit_details.audit_log_id
*/

// ================================
// TYPE DEFINITIONS
// ================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

export type PermissionCondition = typeof permission_conditions.$inferSelect;
export type NewPermissionCondition = typeof permission_conditions.$inferInsert;

export type RolePermission = typeof role_permissions.$inferSelect;
export type NewRolePermission = typeof role_permissions.$inferInsert;

export type UserRole = typeof user_roles.$inferSelect;
export type NewUserRole = typeof user_roles.$inferInsert;

export type AbacPolicy = typeof abac_policies.$inferSelect;
export type NewAbacPolicy = typeof abac_policies.$inferInsert;

export type PolicyCondition = typeof policy_conditions.$inferSelect;
export type NewPolicyCondition = typeof policy_conditions.$inferInsert;

export type PolicyTarget = typeof policy_targets.$inferSelect;
export type NewPolicyTarget = typeof policy_targets.$inferSelect;

export type UserAttribute = typeof user_attributes.$inferSelect;
export type NewUserAttribute = typeof user_attributes.$inferInsert;

export type ResourceAttribute = typeof resource_attributes.$inferSelect;
export type NewResourceAttribute = typeof resource_attributes.$inferInsert;

export type AccessLog = typeof access_logs.$inferSelect;
export type NewAccessLog = typeof access_logs.$inferInsert;

export type AccessLogEnvironment = typeof access_log_environment.$inferSelect;
export type NewAccessLogEnvironment = typeof access_log_environment.$inferInsert;

export type PolicyAuditLog = typeof policy_audit_logs.$inferSelect;
export type NewPolicyAuditLog = typeof policy_audit_logs.$inferInsert;

export type PolicyAuditDetail = typeof policy_audit_details.$inferSelect;
export type NewPolicyAuditDetail = typeof policy_audit_details.$inferInsert;

export type RoleAuditLog = typeof role_audit_logs.$inferSelect;
export type NewRoleAuditLog = typeof role_audit_logs.$inferInsert;
