import { db } from './drizzle';
import { eq } from 'drizzle-orm';
import {
  users, roles, permissions, role_permissions, user_roles,
  abac_policies, user_attributes, resource_attributes,
  access_logs, policy_audit_logs, role_audit_logs,
  // NEW NORMALIZED TABLES
  permission_conditions, policy_conditions, policy_targets,
  access_log_environment, policy_audit_details
} from './schema';
import { hashPassword } from '../auth/session';

async function seed() {
  console.log('🌱 Seeding database with normalized schema...');

  // Clear existing data (order matters due to foreign keys)
  await db.delete(policy_audit_details);
  await db.delete(access_log_environment);
  await db.delete(policy_conditions);
  await db.delete(policy_targets);
  await db.delete(permission_conditions);
  await db.delete(role_audit_logs);
  await db.delete(policy_audit_logs);
  await db.delete(access_logs);
  await db.delete(resource_attributes);
  await db.delete(user_attributes);
  await db.delete(user_roles);
  await db.delete(role_permissions);
  await db.delete(permissions);
  await db.delete(roles);
  await db.delete(abac_policies);
  await db.delete(users);

  // Seed Users
  const hashedPassword = await hashPassword('password123');
  const userIds = await db.insert(users).values([
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      department: 'IT',
      location: 'HQ',
      clearanceLevel: 'top-secret',
      accountStatus: 'active'
    },
    {
      name: 'Manager User',
      email: 'manager@example.com',
      password: hashedPassword,
      department: 'Sales',
      location: 'HQ',
      clearanceLevel: 'confidential',
      accountStatus: 'active'
    },
    {
      name: 'Employee User',
      email: 'employee@example.com',
      password: hashedPassword,
      department: 'Sales',
      location: 'Branch-A',
      clearanceLevel: 'standard',
      accountStatus: 'active'
    },
    {
      name: 'Contractor User',
      email: 'contractor@example.com',
      password: hashedPassword,
      department: 'IT',
      location: 'Remote',
      clearanceLevel: 'standard',
      accountStatus: 'active'
    }
  ]).returning({ id: users.id });

  // Seed Roles
  const roleIds = await db.insert(roles).values([
    { name: 'super_admin', description: 'Full system access', hierarchy_level: 4, is_active: true },
    { name: 'admin', description: 'Administrative access', hierarchy_level: 3, is_active: true },
    { name: 'manager', description: 'Team management access', hierarchy_level: 2, is_active: true },
    { name: 'employee', description: 'Standard employee access', hierarchy_level: 1, is_active: true },
    { name: 'contractor', description: 'Limited contractor access', hierarchy_level: 1, is_active: true }
  ]).returning({ id: roles.id });

  // Update role hierarchy after getting the IDs
  await db.update(roles)
    .set({ parent_role_id: roleIds[0].id })
    .where(eq(roles.id, roleIds[1].id)); // admin's parent is super_admin

  await db.update(roles)
    .set({ parent_role_id: roleIds[1].id })
    .where(eq(roles.id, roleIds[2].id)); // manager's parent is admin

  await db.update(roles)
    .set({ parent_role_id: roleIds[2].id })
    .where(eq(roles.id, roleIds[3].id)); // employee's parent is manager

  // Seed Permissions (no more conditions field)
  const permissionIds = await db.insert(permissions).values([
    { name: 'users.create', description: 'Create users', resource: 'users', action: 'create', is_active: true },
    { name: 'users.read', description: 'Read users', resource: 'users', action: 'read', is_active: true },
    { name: 'users.update', description: 'Update users', resource: 'users', action: 'update', is_active: true },
    { name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete', is_active: true },
    { name: 'documents.create', description: 'Create documents', resource: 'documents', action: 'create', is_active: true },
    { name: 'documents.read', description: 'Read documents', resource: 'documents', action: 'read', is_active: true },
    { name: 'documents.update', description: 'Update documents', resource: 'documents', action: 'update', is_active: true },
    { name: 'documents.delete', description: 'Delete documents', resource: 'documents', action: 'delete', is_active: true },
    { name: 'reports.create', description: 'Create reports', resource: 'reports', action: 'create', is_active: true },
    { name: 'reports.read', description: 'Read reports', resource: 'reports', action: 'read', is_active: true },
    { name: 'settings.update', description: 'Update settings', resource: 'settings', action: 'update', is_active: true }
  ]).returning({ id: permissions.id });

  // Seed Role-Permission mappings
  await db.insert(role_permissions).values([
    // Super Admin - all permissions
    ...permissionIds.map(p => ({ role_id: roleIds[0].id, permission_id: p.id, granted_by: userIds[0].id })),
    // Admin - most permissions
    { role_id: roleIds[1].id, permission_id: permissionIds[1].id, granted_by: userIds[0].id },
    { role_id: roleIds[1].id, permission_id: permissionIds[2].id, granted_by: userIds[0].id },
    { role_id: roleIds[1].id, permission_id: permissionIds[5].id, granted_by: userIds[0].id },
    { role_id: roleIds[1].id, permission_id: permissionIds[6].id, granted_by: userIds[0].id },
    { role_id: roleIds[1].id, permission_id: permissionIds[9].id, granted_by: userIds[0].id },
    { role_id: roleIds[1].id, permission_id: permissionIds[10].id, granted_by: userIds[0].id },
    // Manager - read/update permissions
    { role_id: roleIds[2].id, permission_id: permissionIds[1].id, granted_by: userIds[0].id },
    { role_id: roleIds[2].id, permission_id: permissionIds[5].id, granted_by: userIds[0].id },
    { role_id: roleIds[2].id, permission_id: permissionIds[6].id, granted_by: userIds[0].id },
    { role_id: roleIds[2].id, permission_id: permissionIds[8].id, granted_by: userIds[0].id },
    { role_id: roleIds[2].id, permission_id: permissionIds[9].id, granted_by: userIds[0].id },
    // Employee - read permissions
    { role_id: roleIds[3].id, permission_id: permissionIds[1].id, granted_by: userIds[0].id },
    { role_id: roleIds[3].id, permission_id: permissionIds[5].id, granted_by: userIds[0].id },
    { role_id: roleIds[3].id, permission_id: permissionIds[9].id, granted_by: userIds[0].id },
    // Contractor - limited read
    { role_id: roleIds[4].id, permission_id: permissionIds[5].id, granted_by: userIds[0].id }
  ]);

  // Seed User-Role assignments
  await db.insert(user_roles).values([
    { user_id: userIds[0].id, role_id: roleIds[0].id, assigned_by: userIds[0].id },
    { user_id: userIds[1].id, role_id: roleIds[2].id, assigned_by: userIds[0].id },
    { user_id: userIds[2].id, role_id: roleIds[3].id, assigned_by: userIds[1].id },
    { user_id: userIds[3].id, role_id: roleIds[4].id, assigned_by: userIds[0].id, expires_at: '2025-12-31' }
  ]);

  // Seed ABAC Policies (NORMALIZED - no JSON fields)
  const policyIds = await db.insert(abac_policies).values([
    {
      id: 'policy-dept-access',
      name: 'Department Document Access',
      description: 'Users can access documents from their department',
      effect: 'allow',
      priority: 10,
      is_active: true
    },
    {
      id: 'policy-clearance',
      name: 'Clearance Level Policy',
      description: 'Users can only access documents at or below their clearance level',
      effect: 'allow',
      priority: 20,
      is_active: true
    },
    {
      id: 'policy-location',
      name: 'Location-based Access',
      description: 'HQ users can access all locations, others only their location',
      effect: 'allow',
      priority: 15,
      is_active: true
    },
    {
      id: 'policy-suspended',
      name: 'Deny Suspended Accounts',
      description: 'Suspended accounts cannot access any resources',
      effect: 'deny',
      priority: 100,
      is_active: true
    }
  ]).returning({ id: abac_policies.id });

  // Seed Policy Conditions (NORMALIZED)
  await db.insert(policy_conditions).values([
    // Department Access Policy Conditions
    {
      policy_id: 'policy-dept-access',
      attribute_path: 'user.department',
      operator: 'equals',
      value: 'resource.department',
      value_type: 'string',
      logical_operator: 'AND',
      condition_order: 0
    },
    // Clearance Level Policy Conditions
    {
      policy_id: 'policy-clearance',
      attribute_path: 'user.clearanceLevel',
      operator: 'gte',
      value: 'resource.clearanceLevel',
      value_type: 'string',
      logical_operator: 'AND',
      condition_order: 0
    },
    // Location-based Access Policy Conditions
    {
      policy_id: 'policy-location',
      attribute_path: 'user.location',
      operator: 'equals',
      value: 'HQ',
      value_type: 'string',
      logical_operator: 'OR',
      condition_order: 0
    },
    {
      policy_id: 'policy-location',
      attribute_path: 'user.location',
      operator: 'equals',
      value: 'resource.location',
      value_type: 'string',
      logical_operator: 'OR',
      condition_order: 1
    },
    // Suspended Account Policy Conditions
    {
      policy_id: 'policy-suspended',
      attribute_path: 'user.accountStatus',
      operator: 'equals',
      value: 'suspended',
      value_type: 'string',
      logical_operator: 'AND',
      condition_order: 0
    }
  ]);

  // Seed Policy Targets (NORMALIZED)
  await db.insert(policy_targets).values([
    // Department Access Policy Targets
    {
      policy_id: 'policy-dept-access',
      resource_type: 'documents',
      resource_id: '*',
      action: 'read',
      target_order: 0
    },
    // Clearance Level Policy Targets
    {
      policy_id: 'policy-clearance',
      resource_type: 'documents',
      resource_id: '*',
      action: 'read',
      target_order: 0
    },
    // Location-based Access Policy Targets
    {
      policy_id: 'policy-location',
      resource_type: 'reports',
      resource_id: '*',
      action: 'read',
      target_order: 0
    },
    // Suspended Account Policy Targets
    {
      policy_id: 'policy-suspended',
      resource_type: '*',
      resource_id: '*',
      action: '*',
      target_order: 0
    }
  ]);

  // Seed User Attributes
  await db.insert(user_attributes).values([
    { user_id: userIds[0].id, attribute_key: 'project_access', attribute_value: 'all', attribute_type: 'string' },
    { user_id: userIds[0].id, attribute_key: 'budget_limit', attribute_value: '1000000', attribute_type: 'number' },
    { user_id: userIds[1].id, attribute_key: 'project_access', attribute_value: 'sales-projects', attribute_type: 'string' },
    { user_id: userIds[1].id, attribute_key: 'budget_limit', attribute_value: '100000', attribute_type: 'number' },
    { user_id: userIds[2].id, attribute_key: 'project_access', attribute_value: 'assigned-only', attribute_type: 'string' },
    { user_id: userIds[3].id, attribute_key: 'contract_end', attribute_value: '2025-12-31', attribute_type: 'date' }
  ]);

  // Seed Resource Attributes
  await db.insert(resource_attributes).values([
    { resource_id: 'doc-001', resource_type: 'document', attribute_key: 'department', attribute_value: 'IT', attribute_type: 'string' },
    { resource_id: 'doc-001', resource_type: 'document', attribute_key: 'clearanceLevel', attribute_value: 'confidential', attribute_type: 'string' },
    { resource_id: 'doc-001', resource_type: 'document', attribute_key: 'location', attribute_value: 'HQ', attribute_type: 'string' },
    { resource_id: 'doc-002', resource_type: 'document', attribute_key: 'department', attribute_value: 'Sales', attribute_type: 'string' },
    { resource_id: 'doc-002', resource_type: 'document', attribute_key: 'clearanceLevel', attribute_value: 'standard', attribute_type: 'string' },
    { resource_id: 'doc-002', resource_type: 'document', attribute_key: 'location', attribute_value: 'Branch-A', attribute_type: 'string' },
    { resource_id: 'report-001', resource_type: 'report', attribute_key: 'location', attribute_value: 'HQ', attribute_type: 'string' },
    { resource_id: 'report-002', resource_type: 'report', attribute_key: 'location', attribute_value: 'Branch-A', attribute_type: 'string' }
  ]);

  // Seed Access Logs (NORMALIZED - with new fields)
  const accessLogIds = await db.insert(access_logs).values([
    {
      user_id: userIds[0].id,
      resource_id: 'doc-001',
      resource_type: 'document',
      action: 'read',
      decision: 'allow',
      reason: 'Super admin access',
      rbac_granted: true,
      abac_granted: true,
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      session_id: 'session-001',
      request_method: 'GET',
      endpoint: '/documents/doc-001',
      response_status: 200
    },
    {
      user_id: userIds[2].id,
      resource_id: 'doc-002',
      resource_type: 'document',
      action: 'read',
      decision: 'allow',
      reason: 'Department match and clearance level sufficient',
      policy_id: 'policy-dept-access',
      rbac_granted: true,
      abac_granted: true,
      ip_address: '192.168.1.102',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      session_id: 'session-003',
      request_method: 'GET',
      endpoint: '/documents/doc-002',
      response_status: 200
    },
    {
      user_id: userIds[3].id,
      resource_id: 'doc-001',
      resource_type: 'document',
      action: 'read',
      decision: 'deny',
      reason: 'Insufficient clearance level',
      policy_id: 'policy-clearance',
      rbac_granted: false,
      abac_granted: false,
      ip_address: '192.168.1.103',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      session_id: 'session-004',
      request_method: 'GET',
      endpoint: '/documents/doc-001',
      response_status: 403
    }
  ]).returning({ id: access_logs.id });

  // Seed Access Log Environment (NORMALIZED)
  await db.insert(access_log_environment).values([
    {
      access_log_id: accessLogIds[0].id,
      environment_key: 'time',
      environment_value: 'business_hours',
      environment_type: 'string'
    },
    {
      access_log_id: accessLogIds[0].id,
      environment_key: 'location',
      environment_value: 'office',
      environment_type: 'string'
    },
    {
      access_log_id: accessLogIds[1].id,
      environment_key: 'time',
      environment_value: 'business_hours',
      environment_type: 'string'
    },
    {
      access_log_id: accessLogIds[1].id,
      environment_key: 'device_type',
      environment_value: 'desktop',
      environment_type: 'string'
    },
    {
      access_log_id: accessLogIds[2].id,
      environment_key: 'time',
      environment_value: 'after_hours',
      environment_type: 'string'
    },
    {
      access_log_id: accessLogIds[2].id,
      environment_key: 'location',
      environment_value: 'remote',
      environment_type: 'string'
    }
  ]);

  // Seed Policy Audit Logs (NORMALIZED)
  const policyAuditLogIds = await db.insert(policy_audit_logs).values([
    {
      policy_id: 'policy-dept-access',
      action: 'create',
      changed_by: userIds[0].id,
      reason: 'Initial policy setup',
      old_policy_name: null,
      new_policy_name: 'Department Document Access',
      old_effect: null,
      new_effect: 'allow',
      old_priority: null,
      new_priority: 10
    },
    {
      policy_id: 'policy-clearance',
      action: 'create',
      changed_by: userIds[0].id,
      reason: 'Security requirement',
      old_policy_name: null,
      new_policy_name: 'Clearance Level Policy',
      old_effect: null,
      new_effect: 'allow',
      old_priority: null,
      new_priority: 20
    }
  ]).returning({ id: policy_audit_logs.id });

  // Seed Policy Audit Details (NORMALIZED)
  await db.insert(policy_audit_details).values([
    {
      audit_log_id: policyAuditLogIds[0].id,
      detail_type: 'condition',
      detail_key: 'conditions[0].attribute',
      old_value: null,
      new_value: 'user.department',
      value_type: 'string'
    },
    {
      audit_log_id: policyAuditLogIds[0].id,
      detail_type: 'target',
      detail_key: 'target.resource',
      old_value: null,
      new_value: 'documents',
      value_type: 'string'
    },
    {
      audit_log_id: policyAuditLogIds[1].id,
      detail_type: 'condition',
      detail_key: 'conditions[0].attribute',
      old_value: null,
      new_value: 'user.clearanceLevel',
      value_type: 'string'
    },
    {
      audit_log_id: policyAuditLogIds[1].id,
      detail_type: 'target',
      detail_key: 'target.action',
      old_value: null,
      new_value: 'read',
      value_type: 'string'
    }
  ]);

  // Seed Role Audit Logs
  await db.insert(role_audit_logs).values([
    {
      user_id: userIds[1].id,
      role_id: roleIds[2].id,
      action: 'assign',
      changed_by: userIds[0].id,
      reason: 'Promoted to manager'
    },
    {
      user_id: userIds[3].id,
      role_id: roleIds[4].id,
      action: 'assign',
      changed_by: userIds[0].id,
      reason: 'New contractor onboarding',
      expires_at: '2025-12-31'
    }
  ]);

  console.log('✅ Database seeded successfully with normalized schema!');
  console.log(`   - ${userIds.length} users`);
  console.log(`   - ${roleIds.length} roles`);
  console.log(`   - ${permissionIds.length} permissions`);
  console.log('   - 4 ABAC policies with normalized conditions and targets');
  console.log('   - Sample normalized audit logs created');
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
