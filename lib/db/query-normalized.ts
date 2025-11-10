import { db } from './drizzle';
import { eq, and, or, inArray, like, desc, asc, sql, gt, lt, gte, lte } from 'drizzle-orm';
import {
  users, roles, permissions, role_permissions, user_roles,
  abac_policies, user_attributes, resource_attributes,
  access_logs, policy_audit_logs, role_audit_logs,
  // NEW NORMALIZED TABLES
  permission_conditions, policy_conditions, policy_targets,
  access_log_environment, policy_audit_details,
  User, NewUser, Role, NewRole, Permission, NewPermission,
  RolePermission, NewRolePermission, UserRole, NewUserRole,
  AbacPolicy, NewAbacPolicy, UserAttribute, NewUserAttribute,
  ResourceAttribute, NewResourceAttribute, AccessLog, NewAccessLog,
  PolicyAuditLog, NewPolicyAuditLog, RoleAuditLog, NewRoleAuditLog,
  // NEW NORMALIZED TYPES
  PermissionCondition, NewPermissionCondition,
  PolicyCondition, NewPolicyCondition,
  PolicyTarget, NewPolicyTarget,
  AccessLogEnvironment, NewAccessLogEnvironment,
  PolicyAuditDetail, NewPolicyAuditDetail
} from './schema-normalized';
import { hashPassword, comparePasswords } from '../auth/session';

// ================================
// PERMISSION CONDITIONS QUERIES (NORMALIZED)
// ================================

export async function getPermissionConditions(permissionId: number): Promise<PermissionCondition[]> {
  return await db.select().from(permission_conditions)
    .where(eq(permission_conditions.permission_id, permissionId))
    .orderBy(asc(permission_conditions.id));
}

export async function createPermissionWithConditions(
  permissionData: NewPermission, 
  conditions: Array<{
    attribute_path: string;
    operator: string;
    value: string;
    value_type?: string;
  }>
): Promise<{ permission: Permission[], conditions: PermissionCondition[] }> {
  const permission = await db.insert(permissions).values(permissionData).returning();
  const permissionId = permission[0].id;
  
  const conditionsData = conditions.map((condition, index) => ({
    permission_id: permissionId,
    attribute_path: condition.attribute_path,
    operator: condition.operator,
    value: condition.value,
    value_type: condition.value_type || 'string',
  }));
  
  const createdConditions = await db.insert(permission_conditions).values(conditionsData).returning();
  
  return { permission, conditions: createdConditions };
}

export async function hasPermissionWithConditions(
  userId: number, 
  resource: string, 
  action: string
): Promise<{ hasPermission: boolean; conditions: PermissionCondition[] }> {
  // First check basic permission
  const permissions_result = await db.select().from(permissions)
    .where(and(
      eq(permissions.resource, resource),
      eq(permissions.action, action),
      eq(permissions.is_active, true)
    ));
  
  if (permissions_result.length === 0) {
    return { hasPermission: false, conditions: [] };
  }
  
  // Get all conditions for this permission
  const permissionId = permissions_result[0].id;
  const conditions = await getPermissionConditions(permissionId);
  
  // Evaluate conditions (simplified)
  let conditionsMet = true;
  for (const condition of conditions) {
    // This would need more sophisticated evaluation logic
    // For now, just checking if conditions exist
    if (condition.attribute_path && condition.operator && condition.value) {
      // More complex condition evaluation would go here
    }
  }
  
  return { hasPermission: conditionsMet, conditions };
}

// ================================
// POLICY CONDITIONS QUERIES (NORMALIZED)
// ================================

export async function getPolicyConditions(policyId: string): Promise<PolicyCondition[]> {
  return await db.select().from(policy_conditions)
    .where(eq(policy_conditions.policy_id, policyId))
    .orderBy(asc(policy_conditions.condition_order));
}

export async function getPolicyTargets(policyId: string): Promise<PolicyTarget[]> {
  return await db.select().from(policy_targets)
    .where(eq(policy_targets.policy_id, policyId))
    .orderBy(asc(policy_targets.target_order));
}

export async function createPolicyWithConditionsAndTargets(
  policyData: NewAbacPolicy,
  conditions: Array<{
    attribute_path: string;
    operator: string;
    value: string;
    value_type?: string;
    logical_operator?: string;
  }>,
  targets: Array<{
    resource_type?: string;
    resource_id?: string;
    action: string;
  }>
): Promise<{ policy: AbacPolicy[], conditions: PolicyCondition[], targets: PolicyTarget[] }> {
  const policy = await db.insert(abac_policies).values(policyData).returning();
  const policyId = policy[0].id;
  
  const conditionsData = conditions.map((condition, index) => ({
    policy_id: policyId,
    attribute_path: condition.attribute_path,
    operator: condition.operator,
    value: condition.value,
    value_type: condition.value_type || 'string',
    logical_operator: condition.logical_operator || 'AND',
    condition_order: index,
  }));
  
  const targetsData = targets.map((target, index) => ({
    policy_id: policyId,
    resource_type: target.resource_type || '*',
    resource_id: target.resource_id || '*',
    action: target.action,
    target_order: index,
  }));
  
  const createdConditions = await db.insert(policy_conditions).values(conditionsData).returning();
  const createdTargets = await db.insert(policy_targets).values(targetsData).returning();
  
  return { policy, conditions: createdConditions, targets: createdTargets };
}

export async function getPoliciesByTargetNormalized(
  resource: string, 
  action: string
): Promise<(AbacPolicy & { conditions: PolicyCondition[], targets: PolicyTarget[] })[]> {
  // Get policies that match this resource/action
  const policies = await db.select().from(abac_policies)
    .where(eq(abac_policies.is_active, true))
    .orderBy(desc(abac_policies.priority));
  
  // Filter policies that have matching targets
  const matchingPolicies = [];
  for (const policy of policies) {
    const targets = await getPolicyTargets(policy.id);
    const hasMatchingTarget = targets.some(target => 
      (target.resource_type === '*' || target.resource_type === resource) &&
      (target.resource_id === '*' || target.resource_id === resource) &&
      (target.action === '*' || target.action === action)
    );
    
    if (hasMatchingTarget) {
      const conditions = await getPolicyConditions(policy.id);
      matchingPolicies.push({
        ...policy,
        conditions,
        targets
      });
    }
  }
  
  return matchingPolicies;
}

export async function canUserAccessResourceNormalized(userId: number, resourceId: string, action: string): Promise<{
  allowed: boolean;
  rbac_granted: boolean;
  abac_granted: boolean;
  reason: string;
  matched_policies: (AbacPolicy & { conditions: PolicyCondition[], targets: PolicyTarget[] })[];
}> {
  const user = await getUserById(userId);
  if (!user) {
    return { 
      allowed: false, 
      rbac_granted: false, 
      abac_granted: false, 
      reason: 'User not found',
      matched_policies: []
    };
  }
  
  // Check RBAC (simplified)
  const rbacResult = await hasPermission(userId, resourceId, action);
  
  // Check ABAC using normalized schema
  const matchingPolicies = await getPoliciesByTargetNormalized(resourceId, action);
  
  let abacResult = true;
  const appliedPolicies = [];
  
  for (const policy of matchingPolicies) {
    // Evaluate conditions
    let conditionMet = true;
    for (const condition of policy.conditions) {
      let currentConditionMet = false;
      
      // Simple condition evaluation (can be enhanced)
      if (condition.attribute_path === 'user.accountStatus' && condition.operator === 'equals') {
        currentConditionMet = user.accountStatus === condition.value;
      } else if (condition.attribute_path === 'user.department' && condition.operator === 'equals') {
        currentConditionMet = user.department === condition.value;
      } else if (condition.attribute_path === 'user.clearanceLevel' && condition.operator === 'equals') {
        currentConditionMet = user.clearanceLevel === condition.value;
      }
      // Add more condition types as needed
      
      if (condition.logical_operator === 'OR') {
        conditionMet = conditionMet || currentConditionMet;
      } else {
        conditionMet = conditionMet && currentConditionMet;
      }
    }
    
    if (conditionMet) {
      appliedPolicies.push(policy);
      if (policy.effect === 'deny') {
        abacResult = false;
        break;
      } else if (policy.effect === 'allow') {
        abacResult = true;
        // Don't break here, continue to check for deny policies
      }
    }
  }
  
  const allowed = rbacResult && abacResult;
  
  // Log the access attempt
  await createAccessLog({
    user_id: userId,
    resource_id: resourceId,
    resource_type: 'normalized_resource',
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
    reason: allowed ? 'Access granted' : 'Access denied by policy',
    matched_policies: appliedPolicies
  };
}

// ================================
// ACCESS LOG ENVIRONMENT QUERIES (NORMALIZED)
// ================================

export async function createAccessLogWithEnvironment(
  logData: NewAccessLog,
  environmentData: Array<{
    environment_key: string;
    environment_value: string;
    environment_type?: string;
  }>
): Promise<{ accessLog: AccessLog[], environment: AccessLogEnvironment[] }> {
  const accessLog = await db.insert(access_logs).values(logData).returning();
  const accessLogId = accessLog[0].id;
  
  const environmentRecords = environmentData.map(env => ({
    access_log_id: accessLogId,
    environment_key: env.environment_key,
    environment_value: env.environment_value,
    environment_type: env.environment_type || 'string',
  }));
  
  const environment = await db.insert(access_log_environment).values(environmentRecords).returning();
  
  return { accessLog, environment };
}

export async function getAccessLogsWithEnvironmentByUser(
  userId: number, 
  limit: number = 100
): Promise<(AccessLog & { environment: AccessLogEnvironment[] })[]> {
  const logs = await db.select().from(access_logs)
    .where(eq(access_logs.user_id, userId))
    .orderBy(desc(access_logs.timestamp))
    .limit(limit);
  
  // Get environment data for each log
  const logsWithEnvironment = [];
  for (const log of logs) {
    const environment = await db.select().from(access_log_environment)
      .where(eq(access_log_environment.access_log_id, log.id));
    
    logsWithEnvironment.push({
      ...log,
      environment
    });
  }
  
  return logsWithEnvironment;
}

// ================================
// POLICY AUDIT DETAILS QUERIES (NORMALIZED)
// ================================

export async function createPolicyAuditLogWithDetails(
  logData: NewPolicyAuditLog,
  details: Array<{
    detail_type: string;
    detail_key: string;
    old_value?: string;
    new_value?: string;
    value_type?: string;
  }>
): Promise<{ auditLog: PolicyAuditLog[], details: PolicyAuditDetail[] }> {
  const auditLog = await db.insert(policy_audit_logs).values(logData).returning();
  const auditLogId = auditLog[0].id;
  
  const detailRecords = details.map(detail => ({
    audit_log_id: auditLogId,
    detail_type: detail.detail_type,
    detail_key: detail.detail_key,
    old_value: detail.old_value,
    new_value: detail.new_value,
    value_type: detail.value_type || 'string',
  }));
  
  const createdDetails = await db.insert(policy_audit_details).values(detailRecords).returning();
  
  return { auditLog, details: createdDetails };
}

// ================================
// EXISTING QUERIES (IMPROVED)
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
// IMPROVED RBAC QUERIES
// ================================

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

export async function getUserPermissions(userId: number): Promise<Permission[]> {
  return await db.select({
    id: permissions.id,
    name: permissions.name,
    description: permissions.description,
    resource: permissions.resource,
    action: permissions.action,
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
// IMPROVED UTILITY QUERIES
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

// ================================
// MISSING FUNCTION (ADDED FOR COMPLETENESS)
// ================================

export async function createAccessLog(logData: NewAccessLog): Promise<AccessLog[]> {
  return await db.insert(access_logs).values(logData).returning();
}