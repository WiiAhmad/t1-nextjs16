import { db } from './drizzle';
import { eq } from 'drizzle-orm';
import {
  users, roles, permissions, role_permissions, user_roles,
  abac_policies, user_attributes, resource_attributes,
  access_logs, policy_audit_logs, role_audit_logs
} from './schema';
import { hashPassword } from '../auth/session';

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
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

  // Seed Permissions
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

  // Seed ABAC Policies
  await db.insert(abac_policies).values([
    {
      id: 'policy-dept-access',
      name: 'Department Document Access',
      description: 'Users can access documents from their department',
      effect: 'allow',
      conditions: JSON.stringify([
        { attribute: 'user.department', operator: 'equals', value: 'resource.department' }
      ]),
      target: JSON.stringify({ resource: 'documents', action: 'read' }),
      priority: 10
    },
    {
      id: 'policy-clearance',
      name: 'Clearance Level Policy',
      description: 'Users can only access documents at or below their clearance level',
      effect: 'allow',
      conditions: JSON.stringify([
        { attribute: 'user.clearanceLevel', operator: 'gte', value: 'resource.clearanceLevel' }
      ]),
      target: JSON.stringify({ resource: 'documents', action: 'read' }),
      priority: 20
    },
    {
      id: 'policy-location',
      name: 'Location-based Access',
      description: 'HQ users can access all locations, others only their location',
      effect: 'allow',
      conditions: JSON.stringify([
        { 
          operator: 'or',
          conditions: [
            { attribute: 'user.location', operator: 'equals', value: 'HQ' },
            { attribute: 'user.location', operator: 'equals', value: 'resource.location' }
          ]
        }
      ]),
      target: JSON.stringify({ resource: 'reports', action: 'read' }),
      priority: 15
    },
    {
      id: 'policy-suspended',
      name: 'Deny Suspended Accounts',
      description: 'Suspended accounts cannot access any resources',
      effect: 'deny',
      conditions: JSON.stringify([
        { attribute: 'user.accountStatus', operator: 'equals', value: 'suspended' }
      ]),
      target: JSON.stringify({ resource: '*', action: '*' }),
      priority: 100
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

  // Seed Access Logs
  await db.insert(access_logs).values([
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
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  ]);

  // Seed Policy Audit Logs
  await db.insert(policy_audit_logs).values([
    {
      policy_id: 'policy-dept-access',
      action: 'create',
      changed_by: userIds[0].id,
      new_value: JSON.stringify({ name: 'Department Document Access', effect: 'allow' }),
      reason: 'Initial policy setup'
    },
    {
      policy_id: 'policy-clearance',
      action: 'create',
      changed_by: userIds[0].id,
      new_value: JSON.stringify({ name: 'Clearance Level Policy', effect: 'allow' }),
      reason: 'Security requirement'
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

  console.log('✅ Database seeded successfully!');
  console.log(`   - ${userIds.length} users`);
  console.log(`   - ${roleIds.length} roles`);
  console.log(`   - ${permissionIds.length} permissions`);
  console.log('   - 4 ABAC policies');
  console.log('   - Sample audit logs created');
}

seed()
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
