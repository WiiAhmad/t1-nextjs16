import { db } from './drizzle';
import { eq, and, or, inArray, like, desc, asc, sql, gt, lt, gte, lte } from 'drizzle-orm';
import {
  users, roles, permissions, role_permissions, user_roles,
  abac_policies, user_attributes, resource_attributes,
  access_logs, policy_audit_logs, role_audit_logs,
  User, NewUser, Role, NewRole, Permission, NewPermission,
  RolePermission, NewRolePermission, UserRole, NewUserRole,
  AbacPolicy, NewAbacPolicy, UserAttribute, NewUserAttribute,
  ResourceAttribute, NewResourceAttribute, AccessLog, NewAccessLog,
  PolicyAuditLog, NewPolicyAuditLog, RoleAuditLog, NewRoleAuditLog
} from './schema';
import { hashPassword, comparePasswords } from '../auth/session';

// ================================
// USER QUERIES
// ================================

export async function getUserById(id: number): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.id, id));
  return result[0];
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0];
}

export async function getAllUsers(): Promise<User[]> {
  return await db.select().from(users);
}

export async function getActiveUsers(): Promise<User[]> {
  return await db.select().from(users).where(eq(users.isActive, true));
}

export async function createUser(userData: Omit<NewUser, 'password'>, password: string): Promise<User[]> {
  const hashedPassword = await hashPassword(password);
  return await db.insert(users).values({
    ...userData,
    password: hashedPassword
  }).returning();
}

export async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  if (!user) return null;
  
  const isValidPassword = await comparePasswords(password, user.password);
  if (!isValidPassword) return null;
  
  return user;
}

export async function updateUser(id: number, userData: Partial<NewUser>): Promise<User[]> {
  return await db.update(users)
    .set({ ...userData, updatedAt: new Date().toISOString() })
    .where(eq(users.id, id))
    .returning();
}

export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

export async function updateUserLastLogin(id: number): Promise<void> {
  await db.update(users)
    .set({ lastLogin: new Date().toISOString() })
    .where(eq(users.id, id));
}

export async function deactivateUser(id: number): Promise<User[]> {
  return await db.update(users)
    .set({ isActive: false })
    .where(eq(users.id, id))
    .returning();
}

export async function activateUser(id: number): Promise<User[]> {
  return await db.update(users)
    .set({ isActive: true })
    .where(eq(users.id, id))
    .returning();
}

// ================================
// ROLE QUERIES
// ================================

export async function getRoleById(id: number): Promise<Role | undefined> {
  const result = await db.select().from(roles).where(eq(roles.id, id));
  return result[0];
}

export async function getRoleByName(name: string): Promise<Role | undefined> {
  const result = await db.select().from(roles).where(eq(roles.name, name));
  return result[0];
}

export async function getAllRoles(): Promise<Role[]> {
  return await db.select().from(roles);
}

export async function getActiveRoles(): Promise<Role[]> {
  return await db.select().from(roles).where(eq(roles.is_active, true));
}

export async function getRolesByHierarchyLevel(level: number): Promise<Role[]> {
  return await db.select().from(roles).where(eq(roles.hierarchy_level, level));
}

export async function getSubRoles(parentRoleId: number): Promise<Role[]> {
  return await db.select().from(roles).where(eq(roles.parent_role_id, parentRoleId));
}

export async function createRole(roleData: NewRole): Promise<Role[]> {
  return await db.insert(roles).values(roleData).returning();
}

export async function updateRole(id: number, roleData: Partial<NewRole>): Promise<Role[]> {
  return await db.update(roles)
    .set({ ...roleData, updated_at: new Date().toISOString() })
    .where(eq(roles.id, id))
    .returning();
}

export async function deleteRole(id: number): Promise<void> {
  await db.delete(roles).where(eq(roles.id, id));
}

// ================================
// PERMISSION QUERIES
// ================================

export async function getPermissionById(id: number): Promise<Permission | undefined> {
  const result = await db.select().from(permissions).where(eq(permissions.id, id));
  return result[0];
}

export async function getPermissionByName(name: string): Promise<Permission | undefined> {
  const result = await db.select().from(permissions).where(eq(permissions.name, name));
  return result[0];
}

export async function getAllPermissions(): Promise<Permission[]> {
  return await db.select().from(permissions);
}

export async function getActivePermissions(): Promise<Permission[]> {
  return await db.select().from(permissions).where(eq(permissions.is_active, true));
}

export async function getPermissionsByResource(resource: string): Promise<Permission[]> {
  return await db.select().from(permissions).where(eq(permissions.resource, resource));
}

export async function getPermissionsByAction(action: string): Promise<Permission[]> {
  return await db.select().from(permissions).where(eq(permissions.action, action));
}

export async function getPermissionsByResourceAndAction(resource: string, action: string): Promise<Permission[]> {
  return await db.select()
    .from(permissions)
    .where(and(eq(permissions.resource, resource), eq(permissions.action, action)));
}

export async function createPermission(permissionData: NewPermission): Promise<Permission[]> {
  return await db.insert(permissions).values(permissionData).returning();
}

export async function updatePermission(id: number, permissionData: Partial<NewPermission>): Promise<Permission[]> {
  return await db.update(permissions)
    .set(permissionData)
    .where(eq(permissions.id, id))
    .returning();
}

export async function deletePermission(id: number): Promise<void> {
  await db.delete(permissions).where(eq(permissions.id, id));
}

// ================================
// ROLE-PERMISSION MAPPING QUERIES
// ================================

export async function getRolePermissions(roleId: number): Promise<Permission[]> {
  return await db.select({
    id: permissions.id,
    name: permissions.name,
    description: permissions.description,
    resource: permissions.resource,
    action: permissions.action,
    conditions: permissions.conditions,
    is_active: permissions.is_active,
    created_at: permissions.created_at
  })
    .from(role_permissions)
    .innerJoin(permissions, eq(role_permissions.permission_id, permissions.id))
    .where(eq(role_permissions.role_id, roleId));
}

export async function getUserPermissions(userId: number): Promise<Permission[]> {
  return await db.select({
    id: permissions.id,
    name: permissions.name,
    description: permissions.description,
    resource: permissions.resource,
    action: permissions.action,
    conditions: permissions.conditions,
    is_active: permissions.is_active,
    created_at: permissions.created_at
  })
    .from(user_roles)
    .innerJoin(role_permissions, eq(user_roles.role_id, role_permissions.role_id))
    .innerJoin(permissions, eq(role_permissions.permission_id, permissions.id))
    .where(and(
      eq(user_roles.user_id, userId),
      eq(user_roles.is_active, true)
    ));
}

export async function grantPermissionToRole(roleId: number, permissionId: number, grantedBy: number): Promise<RolePermission[]> {
  return await db.insert(role_permissions).values({
    role_id: roleId,
    permission_id: permissionId,
    granted_by: grantedBy
  }).returning();
}

export async function revokePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
  await db.delete(role_permissions)
    .where(and(
      eq(role_permissions.role_id, roleId),
      eq(role_permissions.permission_id, permissionId)
    ));
}

export async function hasPermission(userId: number, resource: string, action: string): Promise<boolean> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(user_roles)
    .innerJoin(role_permissions, eq(user_roles.role_id, role_permissions.role_id))
    .innerJoin(permissions, eq(role_permissions.permission_id, permissions.id))
    .where(and(
      eq(user_roles.user_id, userId),
      eq(user_roles.is_active, true),
      eq(permissions.resource, resource),
      eq(permissions.action, action),
      eq(permissions.is_active, true)
    ));
  
  return result[0].count > 0;
}

// ================================
// USER-ROLE ASSIGNMENT QUERIES
// ================================

export async function getUserRoles(userId: number): Promise<Role[]> {
  return await db.select({
    id: roles.id,
    name: roles.name,
    description: roles.description,
    hierarchy_level: roles.hierarchy_level,
    parent_role_id: roles.parent_role_id,
    is_active: roles.is_active,
    created_at: roles.created_at,
    updated_at: roles.updated_at
  })
    .from(user_roles)
    .innerJoin(roles, eq(user_roles.role_id, roles.id))
    .where(and(
      eq(user_roles.user_id, userId),
      eq(user_roles.is_active, true)
    ));
}

export async function getRoleUsers(roleId: number): Promise<User[]> {
  return await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    password: users.password,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
    isActive: users.isActive,
    lastLogin: users.lastLogin,
    department: users.department,
    location: users.location,
    clearanceLevel: users.clearanceLevel,
    accountStatus: users.accountStatus
  })
    .from(user_roles)
    .innerJoin(users, eq(user_roles.user_id, users.id))
    .where(and(
      eq(user_roles.role_id, roleId),
      eq(user_roles.is_active, true)
    ));
}

export async function assignRoleToUser(userId: number, roleId: number, assignedBy: number, expiresAt?: string): Promise<UserRole[]> {
  return await db.insert(user_roles).values({
    user_id: userId,
    role_id: roleId,
    assigned_by: assignedBy,
    expires_at: expiresAt
  }).returning();
}

export async function revokeRoleFromUser(userId: number, roleId: number): Promise<void> {
  await db.update(user_roles)
    .set({ is_active: false })
    .where(and(
      eq(user_roles.user_id, userId),
      eq(user_roles.role_id, roleId)
    ));
}

export async function isUserInRole(userId: number, roleId: number): Promise<boolean> {
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(user_roles)
    .where(and(
      eq(user_roles.user_id, userId),
      eq(user_roles.role_id, roleId),
      eq(user_roles.is_active, true)
    ));
  
  return result[0].count > 0;
}

// ================================
// ABAC POLICY QUERIES
// ================================

export async function getPolicyById(id: string): Promise<AbacPolicy | undefined> {
  const result = await db.select().from(abac_policies).where(eq(abac_policies.id, id));
  return result[0];
}

export async function getAllPolicies(): Promise<AbacPolicy[]> {
  return await db.select().from(abac_policies);
}

export async function getActivePolicies(): Promise<AbacPolicy[]> {
  return await db.select().from(abac_policies).where(eq(abac_policies.is_active, true));
}

export async function getPoliciesByTarget(resource: string, action: string): Promise<AbacPolicy[]> {
  return await db.select().from(abac_policies)
    .where(and(
      eq(abac_policies.is_active, true),
      sql`json_extract(${abac_policies.target}, '$.resource') = ${resource}`,
      sql`json_extract(${abac_policies.target}, '$.action') = ${action}`
    ))
    .orderBy(desc(abac_policies.priority));
}

export async function createPolicy(policyData: NewAbacPolicy): Promise<AbacPolicy[]> {
  return await db.insert(abac_policies).values(policyData).returning();
}

export async function updatePolicy(id: string, policyData: Partial<NewAbacPolicy>): Promise<AbacPolicy[]> {
  return await db.update(abac_policies)
    .set({ ...policyData, updated_at: new Date().toISOString() })
    .where(eq(abac_policies.id, id))
    .returning();
}

export async function deletePolicy(id: string): Promise<void> {
  await db.delete(abac_policies).where(eq(abac_policies.id, id));
}

export async function activatePolicy(id: string): Promise<AbacPolicy[]> {
  return await db.update(abac_policies)
    .set({ is_active: true })
    .where(eq(abac_policies.id, id))
    .returning();
}

export async function deactivatePolicy(id: string): Promise<AbacPolicy[]> {
  return await db.update(abac_policies)
    .set({ is_active: false })
    .where(eq(abac_policies.id, id))
    .returning();
}

// ================================
// USER ATTRIBUTES QUERIES
// ================================

export async function getUserAttribute(userId: number, key: string): Promise<UserAttribute | undefined> {
  const result = await db.select()
    .from(user_attributes)
    .where(and(
      eq(user_attributes.user_id, userId),
      eq(user_attributes.attribute_key, key)
    ));
  return result[0];
}

export async function getUserAttributes(userId: number): Promise<UserAttribute[]> {
  return await db.select()
    .from(user_attributes)
    .where(eq(user_attributes.user_id, userId));
}

export async function getActiveUserAttributes(userId: number): Promise<UserAttribute[]> {
  return await db.select()
    .from(user_attributes)
    .where(and(
      eq(user_attributes.user_id, userId),
      eq(user_attributes.is_active, true)
    ));
}

export async function setUserAttribute(userId: number, key: string, value: string, type: string): Promise<UserAttribute[]> {
  return await db.insert(user_attributes).values({
    user_id: userId,
    attribute_key: key,
    attribute_value: value,
    attribute_type: type
  }).returning();
}

export async function updateUserAttribute(userId: number, key: string, value: string): Promise<UserAttribute[]> {
  return await db.update(user_attributes)
    .set({ attribute_value: value })
    .where(and(
      eq(user_attributes.user_id, userId),
      eq(user_attributes.attribute_key, key)
    ))
    .returning();
}

export async function deleteUserAttribute(userId: number, key: string): Promise<void> {
  await db.delete(user_attributes)
    .where(and(
      eq(user_attributes.user_id, userId),
      eq(user_attributes.attribute_key, key)
    ));
}

// ================================
// RESOURCE ATTRIBUTES QUERIES
// ================================

export async function getResourceAttribute(resourceId: string, key: string): Promise<ResourceAttribute | undefined> {
  const result = await db.select()
    .from(resource_attributes)
    .where(and(
      eq(resource_attributes.resource_id, resourceId),
      eq(resource_attributes.attribute_key, key)
    ));
  return result[0];
}

export async function getResourceAttributes(resourceId: string): Promise<ResourceAttribute[]> {
  return await db.select()
    .from(resource_attributes)
    .where(eq(resource_attributes.resource_id, resourceId));
}

export async function getResourcesByType(resourceType: string): Promise<ResourceAttribute[]> {
  return await db.select()
    .from(resource_attributes)
    .where(eq(resource_attributes.resource_type, resourceType));
}

export async function setResourceAttribute(resourceId: string, resourceType: string, key: string, value: string, type: string): Promise<ResourceAttribute[]> {
  return await db.insert(resource_attributes).values({
    resource_id: resourceId,
    resource_type: resourceType,
    attribute_key: key,
    attribute_value: value,
    attribute_type: type
  }).returning();
}

export async function updateResourceAttribute(resourceId: string, key: string, value: string): Promise<ResourceAttribute[]> {
  return await db.update(resource_attributes)
    .set({ attribute_value: value })
    .where(and(
      eq(resource_attributes.resource_id, resourceId),
      eq(resource_attributes.attribute_key, key)
    ))
    .returning();
}

export async function deleteResourceAttribute(resourceId: string, key: string): Promise<void> {
  await db.delete(resource_attributes)
    .where(and(
      eq(resource_attributes.resource_id, resourceId),
      eq(resource_attributes.attribute_key, key)
    ));
}

// ================================
// ACCESS LOG QUERIES
// ================================

export async function createAccessLog(logData: NewAccessLog): Promise<AccessLog[]> {
  return await db.insert(access_logs).values(logData).returning();
}

export async function getAccessLogsByUser(userId: number, limit: number = 100): Promise<AccessLog[]> {
  return await db.select()
    .from(access_logs)
    .where(eq(access_logs.user_id, userId))
    .orderBy(desc(access_logs.timestamp))
    .limit(limit);
}

export async function getAccessLogsByResource(resourceId: string, limit: number = 100): Promise<AccessLog[]> {
  return await db.select()
    .from(access_logs)
    .where(eq(access_logs.resource_id, resourceId))
    .orderBy(desc(access_logs.timestamp))
    .limit(limit);
}

export async function getAccessLogsByDecision(decision: string, limit: number = 100): Promise<AccessLog[]> {
  return await db.select()
    .from(access_logs)
    .where(eq(access_logs.decision, decision))
    .orderBy(desc(access_logs.timestamp))
    .limit(limit);
}

export async function getAccessLogsByDateRange(startDate: string, endDate: string): Promise<AccessLog[]> {
  return await db.select()
    .from(access_logs)
    .where(and(
      gte(access_logs.timestamp, startDate),
      lte(access_logs.timestamp, endDate)
    ))
    .orderBy(desc(access_logs.timestamp));
}

// ================================
// POLICY AUDIT LOG QUERIES
// ================================

export async function createPolicyAuditLog(logData: NewPolicyAuditLog): Promise<PolicyAuditLog[]> {
  return await db.insert(policy_audit_logs).values(logData).returning();
}

export async function getPolicyAuditLogs(policyId: string, limit: number = 50): Promise<PolicyAuditLog[]> {
  return await db.select()
    .from(policy_audit_logs)
    .where(eq(policy_audit_logs.policy_id, policyId))
    .orderBy(desc(policy_audit_logs.timestamp))
    .limit(limit);
}

export async function getRecentPolicyChanges(limit: number = 20): Promise<PolicyAuditLog[]> {
  return await db.select()
    .from(policy_audit_logs)
    .orderBy(desc(policy_audit_logs.timestamp))
    .limit(limit);
}

// ================================
// ROLE AUDIT LOG QUERIES
// ================================

export async function createRoleAuditLog(logData: NewRoleAuditLog): Promise<RoleAuditLog[]> {
  return await db.insert(role_audit_logs).values(logData).returning();
}

export async function getRoleAuditLogsByUser(userId: number, limit: number = 50): Promise<RoleAuditLog[]> {
  return await db.select()
    .from(role_audit_logs)
    .where(eq(role_audit_logs.user_id, userId))
    .orderBy(desc(role_audit_logs.timestamp))
    .limit(limit);
}

export async function getRoleAuditLogsByRole(roleId: number, limit: number = 50): Promise<RoleAuditLog[]> {
  return await db.select()
    .from(role_audit_logs)
    .where(eq(role_audit_logs.role_id, roleId))
    .orderBy(desc(role_audit_logs.timestamp))
    .limit(limit);
}

// ================================
// COMPOSED QUERIES FOR BUSINESS LOGIC
// ================================

export async function getUserAccessLog(userId: number): Promise<User & { lastAccess?: string; deniedAttempts: number }> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  
  const logs = await getAccessLogsByUser(userId, 10);
  const deniedLogs = await getAccessLogsByUser(userId).then(logs => 
    logs.filter(log => log.decision === 'deny')
  );
  
  return {
    ...user,
    lastAccess: logs[0]?.timestamp || undefined,
    deniedAttempts: deniedLogs.length
  };
}

export async function getUserEffectivePermissions(userId: number): Promise<Permission[]> {
  const user = await getUserById(userId);
  if (!user) throw new Error('User not found');
  
  // Get direct permissions through roles
  const rolePermissions = await getUserPermissions(userId);
  
  // TODO: Add hierarchical role permission inheritance here if needed
  
  return rolePermissions;
}

export async function canUserAccessResource(userId: number, resourceId: string, action: string): Promise<{
  allowed: boolean;
  rbac_granted: boolean;
  abac_granted: boolean;
  reason: string;
}> {
  const user = await getUserById(userId);
  if (!user) {
    return { allowed: false, rbac_granted: false, abac_granted: false, reason: 'User not found' };
  }
  
  // Check RBAC
  const rbacResult = await hasPermission(userId, resourceId, action);
  
  // Check ABAC
  const policies = await getPoliciesByTarget('*', '*');
  
  // Simple ABAC evaluation (can be enhanced)
  let abacResult = true;
  for (const policy of policies) {
    const conditions = JSON.parse(policy.conditions);
    const target = JSON.parse(policy.target);
    
    // Skip if policy doesn't apply to this resource/action
    if (target.resource !== '*' && target.resource !== resourceId) continue;
    if (target.action !== '*' && target.action !== action) continue;
    
    // Evaluate conditions
    let conditionMet = true;
    for (const condition of conditions) {
      if (condition.attribute === 'user.accountStatus' && condition.operator === 'equals') {
        conditionMet = conditionMet && user.accountStatus === condition.value;
      }
      // Add more condition evaluation logic here
    }
    
    if (conditionMet && policy.effect === 'deny') {
      abacResult = false;
      break;
    } else if (conditionMet && policy.effect === 'allow') {
      abacResult = true;
      break;
    }
  }
  
  const allowed = rbacResult && abacResult;
  
  // Log the access attempt
  await createAccessLog({
    user_id: userId,
    resource_id: resourceId,
    resource_type: 'unknown',
    action,
    decision: allowed ? 'allow' : 'deny',
    rbac_granted: rbacResult,
    abac_granted: abacResult,
    reason: allowed ? 'Access granted' : 'Access denied by policy'
  });
  
  return {
    allowed,
    rbac_granted: rbacResult,
    abac_granted: abacResult,
    reason: allowed ? 'Access granted' : 'Access denied by policy'
  };
}

// ================================
// UTILITY QUERIES
// ================================

export async function getDashboardStats() {
  const [userCount, roleCount, permissionCount, policyCount, recentAccessLogs] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(roles),
    db.select({ count: sql<number>`count(*)` }).from(permissions),
    db.select({ count: sql<number>`count(*)` }).from(abac_policies),
    db.select().from(access_logs).orderBy(desc(access_logs.timestamp)).limit(10)
  ]);
  
  return {
    users: userCount[0].count,
    roles: roleCount[0].count,
    permissions: permissionCount[0].count,
    policies: policyCount[0].count,
    recentActivity: recentAccessLogs
  };
}
