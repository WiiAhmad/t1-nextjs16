# RBAC and ABAC Implementation Specifications

## Table of Contents
1. [Introduction](#introduction)
2. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
3. [Attribute-Based Access Control (ABAC)](#attribute-based-access-control-abac)
4. [Hybrid RBAC+ABAC Architecture](#hybrid-rbacabac-architecture)
5. [Database Schema Design](#database-schema-design)
6. [Implementation Strategy](#implementation-strategy)
7. [Code Examples](#code-examples)
8. [Security Considerations](#security-considerations)
9. [Performance Implications](#performance-implications)
10. [Integration with Existing Systems](#integration-with-existing-systems)

## Introduction

This document outlines the comprehensive implementation of Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) for the Next.js 16 TypeScript application. The hybrid approach combines both systems to provide flexible, secure, and scalable access control.

### Access Control Overview

**Role-Based Access Control (RBAC)** assigns permissions to roles, and users inherit permissions through role assignment. This provides a structured, hierarchical approach to access control.

**Attribute-Based Access Control (ABAC)** evaluates access requests based on attributes of users, resources, actions, and environment conditions. This provides fine-grained, context-aware access control.

### Why Hybrid RBAC+ABAC?

The hybrid approach leverages the strengths of both systems:
- **RBAC** for organizational structure and role management
- **ABAC** for dynamic, context-aware decision making
- **Combined** for comprehensive access control coverage

## Role-Based Access Control (RBAC)

### Core RBAC Components

#### 1. Roles Hierarchy
```
System Administrator (Full System Access)
├── Organization Administrator (Multi-Tenant Management)
│   ├── Department Manager (Department-Level Oversight)
│   │   ├── Team Lead (Team Management)
│   │   │   ├── Senior User (Extended Permissions)
│   │   │   │   ├── Regular User (Standard Access)
│   │   │   │   └── Guest User (Limited Access)
```

#### 2. Permission Categories
- **User Management**: Create, read, update, delete user accounts
- **Content Management**: CRUD operations on application content
- **System Administration**: Configuration, monitoring, maintenance
- **Data Access**: Read, write, export data permissions
- **Audit & Compliance**: Access to logs and compliance reports

#### 3. Role Assignment Rules
- Users can have multiple roles
- Roles can inherit permissions from parent roles
- Role assignment requires approval for elevated privileges
- Automatic role expiration for temporary assignments

### RBAC Implementation Details

#### Role Schema Structure
```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  hierarchyLevel: number;
  parentRoleId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: AccessCondition[];
}
```

## Attribute-Based Access Control (ABAC)

### Core ABAC Components

#### 1. Attribute Categories

**User Attributes:**
- `user.id`: Unique user identifier
- `user.department`: Organizational department
- `user.location`: Geographic location
- `user.clearanceLevel`: Security clearance level
- `user.accountStatus`: Active, suspended, terminated
- `user.lastLogin`: Timestamp of last authentication

**Resource Attributes:**
- `resource.type`: Data, application, or system resource
- `resource.sensitivity`: Public, internal, confidential, restricted
- `resource.ownerId`: Resource creator/owner identifier
- `resource.department`: Associated department
- `resource.createdAt`: Resource creation timestamp

**Action Attributes:**
- `action.type`: Read, write, delete, execute, admin
- `action.impact`: Low, medium, high operational impact
- `action.dataClassification`: Data handling requirements

**Environment Attributes:**
- `env.time`: Current time and day
- `env.location`: Request origin location
- `env.deviceType`: Desktop, mobile, tablet
- `env.networkSecurity`: VPN, corporate network, public network
- `env.riskScore`: Calculated security risk

#### 2. Policy Structure

```typescript
interface ABACPolicy {
  id: string;
  name: string;
  description: string;
  effect: 'allow' | 'deny';
  conditions: PolicyCondition[];
  priority: number;
  isActive: boolean;
  target: {
    subject?: AttributeMatch[];
    resource?: AttributeMatch[];
    action?: AttributeMatch[];
    environment?: AttributeMatch[];
  };
}

interface PolicyCondition {
  attribute: string;
  operator: '==' | '!=' | '>=' | '<=' | 'in' | 'not in' | 'contains';
  value: any;
  conditionType?: 'boolean' | 'date' | 'string' | 'number';
}
```

### ABAC Policy Examples

#### 1. Time-Based Access
```typescript
const timeBasedPolicy: ABACPolicy = {
  id: 'work-hours-access',
  name: 'Work Hours Access Control',
  description: 'Restrict access to business hours for sensitive operations',
  effect: 'allow',
  priority: 100,
  target: {
    action: [{ attribute: 'action.type', operator: 'in', value: ['read', 'write'] }],
    resource: [{ attribute: 'resource.sensitivity', operator: '>=', value: 'confidential' }]
  },
  conditions: [
    { attribute: 'env.time.hour', operator: '>=', value: 8 },
    { attribute: 'env.time.hour', operator: '<=', value: 18 },
    { attribute: 'env.time.weekday', operator: 'not in', value: ['saturday', 'sunday'] }
  ]
};
```

#### 2. Department-Based Access
```typescript
const departmentPolicy: ABACPolicy = {
  id: 'department-data-access',
  name: 'Department Data Access',
  description: 'Allow access to department-specific data',
  effect: 'allow',
  priority: 90,
  target: {
    action: [{ attribute: 'action.type', operator: '==', value: 'read' }],
    resource: [{ attribute: 'resource.type', operator: '==', value: 'department_data' }]
  },
  conditions: [
    { attribute: 'user.department', operator: '==', value: '{resource.department}' }
  ]
};
```

## Hybrid RBAC+ABAC Architecture

### Architecture Overview

The hybrid system integrates RBAC and ABAC through a unified access control engine:

```
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│   Access Request│    │  Access Control     │    │  Decision       │
│                 │───▶│  Engine             │───▶│  Result         │
│ - User          │    │                     │    │                 │
│ - Resource      │    │ 1. RBAC Evaluation  │    │ - Allow/Deny    │
│ - Action        │    │ 2. ABAC Evaluation  │    │ - Obligations   │
│ - Environment   │    │ 3. Policy Combine   │    │ - Advice        │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
```

### Decision Flow

1. **Pre-authorization Check**: Validate authentication and session
2. **RBAC Evaluation**: Check role-based permissions
3. **ABAC Evaluation**: Evaluate attribute-based policies
4. **Policy Combination**: Combine results using defined algorithms
5. **Final Decision**: Return access decision with obligations/advice

### Policy Combination Algorithms

#### 1. Priority-Based Resolution
```typescript
enum PolicyCombinationAlgorithm {
  DENY_OVERRIDES = 'deny_overrides',
  ALLOW_OVERRIDES = 'allow_overrides',
  FIRST_APPLICABLE = 'first_applicable',
  ORDERED_ALLOW_OVERRIDES = 'ordered_allow_overrides',
  ORDERED_DENY_OVERRIDES = 'ordered_deny_overrides'
}
```

#### 2. Default Algorithm: Deny Overrides
- If any policy denies access, deny the request
- If RBAC allows but ABAC denies, the request is denied
- Only allow if both RBAC and ABAC permit access

## Database Schema Design

This document describes the comprehensive database schema for the hybrid Role-Based Access Control (RBAC) and Attribute-Based Access Control (ABAC) system implemented in this Next.js 16 TypeScript application.

### Overview

The schema provides a complete foundation for implementing both RBAC and ABAC access control methods, allowing for:

- **RBAC**: Hierarchical roles, permissions, and role assignments
- **ABAC**: Dynamic, attribute-based policies with context-aware evaluation
- **Hybrid Integration**: Seamless combination of both approaches with policy combination algorithms
- **Audit Trail**: Comprehensive logging of all access control decisions and changes

### Database Structure

#### Core Tables

##### 1. Users Table (Enhanced)
```sql
users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT 1,
  last_login TEXT,
  department TEXT,
  location TEXT,
  clearance_level TEXT DEFAULT 'standard',
  account_status TEXT DEFAULT 'active'
);
```

**Purpose**: Extended from the original user table to include ABAC-relevant attributes.

**Key Features**:
- Enhanced with ABAC user attributes (department, location, clearance_level, account_status)
- Maintains backward compatibility with existing authentication system
- Supports both traditional user management and attribute-based evaluation

##### 2. RBAC Tables

###### Roles Table
```sql
roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  hierarchy_level INTEGER DEFAULT 1,
  parent_role_id INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Defines hierarchical roles within the organization.

**Key Features**:
- Hierarchical role structure with parent-child relationships
- Configurable hierarchy levels for sorting and evaluation
- Support for role inheritance (child roles inherit parent permissions)

###### Permissions Table
```sql
permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  conditions TEXT, -- JSON array of conditions
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Defines granular permissions for specific resources and actions.

**Key Features**:
- Resource-action based permission model
- Optional JSON conditions for complex permission logic
- Support for permission inheritance through role hierarchy

###### Role-Permission Mapping
```sql
role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  granted_at TEXT DEFAULT CURRENT_TIMESTAMP,
  granted_by INTEGER,
  PRIMARY KEY (role_id, permission_id)
);
```

**Purpose**: Maps permissions to roles with audit trail.

**Key Features**:
- Many-to-many relationship between roles and permissions
- Tracks who granted the permission and when
- Composite primary key ensures no duplicate mappings

###### User-Role Assignment
```sql
user_roles (
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  assigned_at TEXT DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER,
  expires_at TEXT,
  is_active BOOLEAN DEFAULT 1,
  PRIMARY KEY (user_id, role_id)
);
```

**Purpose**: Assigns roles to users with optional expiration.

**Key Features**:
- Many-to-many relationship between users and roles
- Support for temporary role assignments with expiration
- Tracks assignment metadata for auditing

##### 3. ABAC Tables

###### ABAC Policies Table
```sql
abac_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  effect TEXT NOT NULL, -- 'allow' or 'deny'
  conditions TEXT NOT NULL, -- JSON array of conditions
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  target TEXT NOT NULL, -- JSON object with target attributes
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Stores ABAC policies with JSON-based condition and target definitions.

**Key Features**:
- Flexible policy definition using JSON for conditions and targets
- Priority-based policy evaluation order
- Support for both allow and deny policies
- UUID-based policy IDs for distributed systems

###### User Attributes Table
```sql
user_attributes (
  user_id INTEGER NOT NULL,
  attribute_key TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  attribute_type TEXT NOT NULL, -- string, number, boolean, date, json
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, attribute_key)
);
```

**Purpose**: Stores dynamic user attributes for ABAC evaluation.

**Key Features**:
- Flexible attribute storage supporting multiple data types
- Separate from user table for extensibility
- Support for temporary or dynamic attributes
- Type-safe attribute value storage

###### Resource Attributes Table
```sql
resource_attributes (
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  attribute_key TEXT NOT NULL,
  attribute_value TEXT NOT NULL,
  attribute_type TEXT NOT NULL, -- string, number, boolean, date, json
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (resource_id, attribute_key)
);
```

**Purpose**: Stores attributes of resources for ABAC evaluation.

**Key Features**:
- Resource-centric attribute storage
- Support for different resource types
- Flexible schema for diverse resource attributes
- Efficient querying by resource type

##### 4. Audit and Logging Tables

###### Access Control Audit Logs
```sql
access_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  resource_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  action TEXT NOT NULL,
  decision TEXT NOT NULL, -- 'allow' or 'deny'
  reason TEXT, -- Why the decision was made
  policy_id TEXT, -- Which policy caused the decision
  rbac_granted BOOLEAN, -- Whether RBAC allowed it
  abac_granted BOOLEAN, -- Whether ABAC allowed it
  environment TEXT, -- JSON object with environment details
  ip_address TEXT,
  user_agent TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Comprehensive audit trail of all access control decisions.

**Key Features**:
- Records both RBAC and ABAC evaluation results
- Captures environment context for each decision
- Links decisions to specific policies
- Supports forensic analysis and compliance auditing

###### Policy Change Audit Logs
```sql
policy_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id TEXT NOT NULL,
  action TEXT NOT NULL, -- create, update, delete, activate, deactivate
  changed_by INTEGER NOT NULL,
  old_value TEXT, -- JSON representation of old policy
  new_value TEXT, -- JSON representation of new policy
  reason TEXT, -- Why the change was made
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Tracks all changes to ABAC policies.

**Key Features**:
- Complete change history for policy management
- Links changes to responsible users
- JSON storage of policy versions for rollback capability
- Compliance and governance support

###### Role Assignment Audit Logs
```sql
role_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- assign, revoke, expire
  changed_by INTEGER NOT NULL,
  reason TEXT,
  expires_at TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Purpose**: Tracks role assignment changes for compliance.

**Key Features**:
- Complete audit trail of role management
- Tracks assignment reasons and expiration dates
- Supports SOX compliance and access reviews
- Integration with automated compliance reporting

### Performance Optimizations

#### Indexes

##### RBAC Performance Indexes
```sql
-- Fast user role lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, is_active);

-- Fast role permission lookup
CREATE INDEX IF NOT EXISTS idx_role_permissions_active ON role_permissions(role_id, permission_id);

-- Hierarchical role queries
CREATE INDEX IF NOT EXISTS idx_roles_hierarchy ON roles(parent_role_id, hierarchy_level);

-- Permission lookups by resource and action
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action, is_active);
```

##### ABAC Performance Indexes
```sql
-- Active policy lookup by priority
CREATE INDEX IF NOT EXISTS idx_abac_policies_active ON abac_policies(is_active, priority);

-- User attribute queries
CREATE INDEX IF NOT EXISTS idx_user_attributes_key ON user_attributes(user_id, attribute_key, is_active);

-- Resource attribute queries
CREATE INDEX IF NOT EXISTS idx_resource_attributes_key ON resource_attributes(resource_id, attribute_key);

-- Resource type queries
CREATE INDEX IF NOT EXISTS idx_resource_attributes_type ON resource_attributes(resource_type);
```

##### Audit Performance Indexes
```sql
-- User access history
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id, timestamp);

-- Resource access history
CREATE INDEX IF NOT EXISTS idx_access_logs_resource ON access_logs(resource_id, action, timestamp);

-- Policy change history
CREATE INDEX IF NOT EXISTS idx_policy_audit_logs ON policy_audit_logs(policy_id, timestamp);

-- Role assignment history
CREATE INDEX IF NOT EXISTS idx_role_audit_logs ON role_audit_logs(user_id, role_id, timestamp);
```

### Schema Integration with Existing System

#### Backward Compatibility

The schema maintains full backward compatibility with the existing user table:

1. **Enhanced User Table**: Added ABAC attributes without breaking existing authentication
2. **Preserved Structure**: All existing user fields remain unchanged
3. **Migration Path**: Existing data can be preserved during schema updates

#### Authentication Integration

The schema integrates seamlessly with the existing authentication system:

1. **Session Enhancement**: User attributes are available in authentication sessions
2. **JWT Payload**: Can include role and attribute information
3. **Middleware Support**: Access control middleware can evaluate both RBAC and ABAC

#### Drizzle ORM Patterns

The schema follows established Drizzle ORM patterns:

1. **Type Safety**: Full TypeScript support with inferred types
2. **Query Builder**: Compatible with Drizzle's query builder syntax
3. **Relationships**: Proper foreign key relationships for joins
4. **Migrations**: Ready for Drizzle migration system

### Implementation Guidelines

#### Phase 1: RBAC Foundation
1. Create roles, permissions, and role assignment tables
2. Implement role hierarchy and permission checking
3. Integrate with existing authentication system
4. Add basic role management UI

#### Phase 2: ABAC Framework
1. Create ABAC policy and attribute tables
2. Implement policy evaluation engine
3. Add attribute management capabilities
4. Build policy management interface

#### Phase 3: Hybrid Integration
1. Implement unified access control engine
2. Add policy combination algorithms
3. Integrate RBAC and ABAC evaluation
4. Add comprehensive logging

#### Phase 4: Advanced Features
1. Implement dynamic policies and time-based rules
2. Add risk assessment and anomaly detection
3. Optimize performance with caching
4. Add monitoring and alerting

### Security Considerations

#### Data Protection
- Sensitive attributes can be encrypted at rest
- Audit logs provide complete access trail
- Attribute access is logged and monitored

#### Policy Security
- Policy validation prevents injection attacks
- Privilege escalation prevention through proper design
- Segregation of duties for policy management

#### Compliance Support
- SOX compliance through audit trails
- GDPR support for data access logging
- HIPAA support for healthcare attribute handling

### Future Extensions

The schema is designed to support future enhancements:

1. **Multi-Tenancy**: Ready for organization-based data separation
2. **Distributed Systems**: UUID-based IDs support distributed deployments
3. **Machine Learning**: Audit data supports ML-based anomaly detection
4. **API Integration**: Schema supports external system integration

This comprehensive schema provides a solid foundation for implementing a robust, scalable, and secure hybrid RBAC+ABAC access control system.

## Implementation Strategy

### Phase 1: RBAC Foundation
1. **Database Setup**: Implement role and permission tables
2. **Core Functions**: Create role assignment and permission checking utilities
3. **Middleware Integration**: Add RBAC checks to existing authentication middleware
4. **Admin Interface**: Build role management UI components

### Phase 2: ABAC Framework
1. **Policy Engine**: Implement ABAC policy evaluation engine
2. **Attribute Management**: Create user and resource attribute storage
3. **Policy Management**: Build policy creation and management interface
4. **Integration Layer**: Connect ABAC with existing RBAC system

### Phase 3: Hybrid Integration
1. **Decision Engine**: Implement unified access control decision engine
2. **Policy Combination**: Add policy combination algorithms
3. **Performance Optimization**: Optimize query performance and caching
4. **Monitoring**: Add comprehensive logging and audit trails

### Phase 4: Advanced Features
1. **Dynamic Policies**: Implement time-based and context-aware policies
2. **Risk Assessment**: Add risk-based access control
3. **Machine Learning**: Integrate anomaly detection for access patterns
4. **API Integration**: Expose access control as API for external systems

## Code Examples

### 1. Access Control Engine

```typescript
// lib/auth/access-control.ts
import { db } from '@/lib/db/drizzle';
import { users, userRoles, roles, permissions } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';

// Access request interface
interface AccessRequest {
  userId: number;
  resourceId: string;
  resourceType: string;
  action: string;
  environment?: {
    ip?: string;
    userAgent?: string;
    timestamp?: Date;
    location?: string;
  };
}

// Access decision result
interface AccessDecision {
  granted: boolean;
  reason: string;
  obligations?: AccessObligation[];
  advice?: AccessAdvice[];
}

// Access obligation (required actions)
interface AccessObligation {
  type: 'require_mfa' | 'log_access' | 'require_approval';
  details: Record<string, any>;
}

// Access advice (recommendations)
interface AccessAdvice {
  type: 'suggest_alternative' | 'warn_risk';
  message: string;
}

export class AccessControlEngine {
  /**
   * Main access control evaluation method
   */
  async evaluateAccess(request: AccessRequest): Promise<AccessDecision> {
    try {
      // 1. Validate input
      const validatedRequest = this.validateRequest(request);
      
      // 2. Get user attributes
      const userAttributes = await this.getUserAttributes(validatedRequest.userId);
      
      // 3. Get resource attributes
      const resourceAttributes = await this.getResourceAttributes(
        validatedRequest.resourceId, 
        validatedRequest.resourceType
      );
      
      // 4. Evaluate RBAC
      const rbacResult = await this.evaluateRBAC(validatedRequest, userAttributes);
      
      // 5. Evaluate ABAC
      const abacResult = await this.evaluateABAC(
        validatedRequest, 
        userAttributes, 
        resourceAttributes
      );
      
      // 6. Combine results
      const finalDecision = this.combineDecisions(rbacResult, abacResult);
      
      return finalDecision;
    } catch (error) {
      console.error('Access control evaluation failed:', error);
      return {
        granted: false,
        reason: 'System error during access evaluation'
      };
    }
  }
  
  /**
   * Validate access request
   */
  private validateRequest(request: AccessRequest) {
    const schema = z.object({
      userId: z.number().int().positive(),
      resourceId: z.string().min(1),
      resourceType: z.string().min(1),
      action: z.string().min(1),
      environment: z.object({
        ip: z.string().optional(),
        userAgent: z.string().optional(),
        timestamp: z.date().optional(),
        location: z.string().optional()
      }).optional()
    });
    
    return schema.parse(request);
  }
  
  /**
   * Get user attributes from database
   */
  private async getUserAttributes(userId: number): Promise<Record<string, any>> {
    const attributes = await db
      .select()
      .from(userAttributes)
      .where(and(
        eq(userAttributes.user_id, userId),
        eq(userAttributes.is_active, true)
      ));
    
    // Convert to key-value pairs
    const result: Record<string, any> = {
      id: userId
    };
    
    attributes.forEach(attr => {
      result[attr.attribute_key] = this.parseAttributeValue(attr.attribute_value, attr.attribute_type);
    });
    
    return result;
  }
  
  /**
   * Get resource attributes
   */
  private async getResourceAttributes(resourceId: string, resourceType: string): Promise<Record<string, any>> {
    const attributes = await db
      .select()
      .from(resourceAttributes)
      .where(and(
        eq(resourceAttributes.resource_id, resourceId),
        eq(resourceAttributes.resource_type, resourceType)
      ));
    
    const result: Record<string, any> = {
      id: resourceId,
      type: resourceType
    };
    
    attributes.forEach(attr => {
      result[attr.attribute_key] = this.parseAttributeValue(attr.attribute_value, attr.attribute_type);
    });
    
    return result;
  }
  
  /**
   * Parse attribute value based on type
   */
  private parseAttributeValue(value: string, type: string): any {
    try {
      switch (type) {
        case 'json':
          return JSON.parse(value);
        case 'number':
          return Number(value);
        case 'boolean':
          return value === 'true';
        case 'date':
          return new Date(value);
        default:
          return value;
      }
    } catch {
      return value;
    }
  }
  
  /**
   * Evaluate RBAC permissions
   */
  private async evaluateRBAC(
    request: AccessRequest, 
    userAttributes: Record<string, any>
  ): Promise<AccessDecision> {
    // Get user roles
    const userRolesResult = await db
      .select({
        role: roles,
        permission: permissions
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.role_id, roles.id))
      .leftJoin(rolePermissions, eq(userRoles.role_id, rolePermissions.role_id))
      .leftJoin(permissions, eq(rolePermissions.permission_id, permissions.id))
      .where(and(
        eq(userRoles.user_id, request.userId),
        eq(userRoles.is_active, true),
        eq(roles.is_active, true),
        eq(permissions.is_active, true)
      ));
    
    // Check if any role grants the requested permission
    const hasPermission = userRolesResult.some(rolePermission => {
      const permission = rolePermission.permission;
      return permission && 
             permission.resource === request.resourceType && 
             permission.action === request.action;
    });
    
    if (hasPermission) {
      return {
        granted: true,
        reason: 'RBAC: User has role with required permission'
      };
    }
    
    return {
      granted: false,
      reason: 'RBAC: User does not have role with required permission'
    };
  }
  
  /**
   * Evaluate ABAC policies
   */
  private async evaluateABAC(
    request: AccessRequest,
    userAttributes: Record<string, any>,
    resourceAttributes: Record<string, any>
  ): Promise<AccessDecision> {
    // Get active ABAC policies ordered by priority
    const policies = await db
      .select()
      .from(abacPolicies)
      .where(eq(abacPolicies.is_active, true))
      .orderBy(abacPolicies.priority);
    
    // Evaluate each policy
    for (const policy of policies) {
      const evaluation = await this.evaluatePolicy(
        policy,
        request,
        userAttributes,
        resourceAttributes
      );
      
      if (evaluation.applies) {
        return {
          granted: policy.effect === 'allow',
          reason: `ABAC: ${policy.name} - ${policy.effect}`,
          ...(policy.effect === 'deny' && {
            advice: [{
              type: 'warn_risk',
              message: `Access denied by policy: ${policy.description}`
            }]
          })
        };
      }
    }
    
    // Default deny if no policies apply
    return {
      granted: false,
      reason: 'ABAC: No applicable policies found - default deny'
    };
  }
  
  /**
   * Evaluate single ABAC policy
   */
  private async evaluatePolicy(
    policy: any,
    request: AccessRequest,
    userAttributes: Record<string, any>,
    resourceAttributes: Record<string, any>
  ): Promise<{ applies: boolean; reason?: string }> {
    try {
      const policyTarget = JSON.parse(policy.target);
      const conditions = JSON.parse(policy.conditions);
      
      // Check if policy target matches request
      const targetMatches = await this.checkTargetMatch(
        policyTarget,
        request,
        userAttributes,
        resourceAttributes
      );
      
      if (!targetMatches) {
        return { applies: false };
      }
      
      // Evaluate conditions
      const conditionsMet = await this.evaluateConditions(
        conditions,
        request,
        userAttributes,
        resourceAttributes
      );
      
      return {
        applies: conditionsMet,
        reason: conditionsMet ? 'All conditions met' : 'Conditions not met'
      };
    } catch (error) {
      console.error('Policy evaluation error:', error);
      return { applies: false, reason: 'Policy evaluation error' };
    }
  }
  
  /**
   * Check if policy target matches access request
   */
  private async checkTargetMatch(
    target: any,
    request: AccessRequest,
    userAttributes: Record<string, any>,
    resourceAttributes: Record<string, any>
  ): Promise<boolean> {
    // Check subject (user) target
    if (target.subject) {
      const subjectMatch = this.checkAttributeMatch(
        target.subject,
        userAttributes
      );
      if (!subjectMatch) return false;
    }
    
    // Check resource target
    if (target.resource) {
      const resourceMatch = this.checkAttributeMatch(
        target.resource,
        { ...resourceAttributes, id: request.resourceId, type: request.resourceType }
      );
      if (!resourceMatch) return false;
    }
    
    // Check action target
    if (target.action) {
      const actionMatch = this.checkAttributeMatch(
        target.action,
        { type: request.action }
      );
      if (!actionMatch) return false;
    }
    
    // Check environment target
    if (target.environment && request.environment) {
      const envMatch = this.checkAttributeMatch(
        target.environment,
        request.environment
      );
      if (!envMatch) return false;
    }
    
    return true;
  }
  
  /**
   * Check attribute matching
   */
  private checkAttributeMatch(
    targetAttributes: any[],
    actualAttributes: Record<string, any>
  ): boolean {
    return targetAttributes.every(targetAttr => {
      const actualValue = actualAttributes[targetAttr.attribute];
      const targetValue = targetAttr.value;
      
      switch (targetAttr.operator) {
        case '==':
          return actualValue === targetValue;
        case '!=':
          return actualValue !== targetValue;
        case '>=':
          return actualValue >= targetValue;
        case '<=':
          return actualValue <= targetValue;
        case 'in':
          return Array.isArray(targetValue) && targetValue.includes(actualValue);
        case 'not in':
          return Array.isArray(targetValue) && !targetValue.includes(actualValue);
        case 'contains':
          return Array.isArray(actualValue) && actualValue.includes(targetValue);
        default:
          return false;
      }
    });
  }
  
  /**
   * Evaluate policy conditions
   */
  private async evaluateConditions(
    conditions: any[],
    request: AccessRequest,
    userAttributes: Record<string, any>,
    resourceAttributes: Record<string, any>
  ): Promise<boolean> {
    // For now, implement simple condition evaluation
    // This can be extended with more complex logic
    
    return conditions.every(condition => {
      const attributeValue = this.resolveAttributeValue(
        condition.attribute,
        request,
        userAttributes,
        resourceAttributes
      );
      
      switch (condition.operator) {
        case '==':
          return attributeValue === condition.value;
        case '!=':
          return attributeValue !== condition.value;
        case '>=':
          return attributeValue >= condition.value;
        case '<=':
          return attributeValue <= condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(attributeValue);
        case 'not in':
          return Array.isArray(condition.value) && !condition.value.includes(attributeValue);
        default:
          return false;
      }
    });
  }
  
  /**
   * Resolve attribute values with context
   */
  private resolveAttributeValue(
    attribute: string,
    request: AccessRequest,
    userAttributes: Record<string, any>,
    resourceAttributes: Record<string, any>
  ): any {
    // Handle special attributes
    switch (attribute) {
      case 'env.time.hour':
        return new Date().getHours();
      case 'env.time.weekday':
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[new Date().getDay()];
      case 'env.ip':
        return request.environment?.ip;
      case 'env.userAgent':
        return request.environment?.userAgent;
      case 'env.timestamp':
        return request.environment?.timestamp || new Date();
    }
    
    // Check user attributes
    if (userAttributes[attribute] !== undefined) {
      return userAttributes[attribute];
    }
    
    // Check resource attributes
    if (resourceAttributes[attribute] !== undefined) {
      return resourceAttributes[attribute];
    }
    
    // Handle template attributes (e.g., {resource.department})
    if (typeof attribute === 'string' && attribute.startsWith('{') && attribute.endsWith('}')) {
      const key = attribute.slice(1, -1);
      return this.resolveAttributeValue(key, request, userAttributes, resourceAttributes);
    }
    
    return undefined;
  }
  
  /**
   * Combine RBAC and ABAC decisions
   */
  private combineDecisions(
    rbacDecision: AccessDecision,
    abacDecision: AccessDecision
  ): AccessDecision {
    // Implement deny-override algorithm
    if (!rbacDecision.granted || !abacDecision.granted) {
      return {
        granted: false,
        reason: `Combined: RBAC(${rbacDecision.reason}) + ABAC(${abacDecision.reason})`,
        advice: [...(rbacDecision.advice || []), ...(abacDecision.advice || [])]
      };
    }
    
    return {
      granted: true,
      reason: `Combined: RBAC(${rbacDecision.reason}) + ABAC(${abacDecision.reason})`,
      obligations: [...(rbacDecision.obligations || []), ...(abacDecision.obligations || [])]
    };
  }
}

// Export singleton instance
export const accessControlEngine = new AccessControlEngine();
```

### 2. Policy Management System

```typescript
// lib/auth/policy-manager.ts
import { db } from '@/lib/db/drizzle';
import { abacPolicies } from '@/lib/db/schema';
import { z } from 'zod';

export class PolicyManager {
  /**
   * Create new ABAC policy
   */
  async createPolicy(policyData: {
    id: string;
    name: string;
    description: string;
    effect: 'allow' | 'deny';
    target: Record<string, any>;
    conditions: any[];
    priority: number;
  }): Promise<void> {
    const schema = z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      description: z.string().min(1),
      effect: z.enum(['allow', 'deny']),
      target: z.record(z.any()),
      conditions: z.array(z.record(z.any())),
      priority: z.number().int()
    });
    
    const validatedData = schema.parse(policyData);
    
    await db.insert(abacPolicies).values({
      id: validatedData.id,
      name: validatedData.name,
      description: validatedData.description,
      effect: validatedData.effect,
      target: JSON.stringify(validatedData.target),
      conditions: JSON.stringify(validatedData.conditions),
      priority: validatedData.priority
    });
  }
  
  /**
   * Update existing policy
   */
  async updatePolicy(policyId: string, updates: Partial<{
    name: string;
    description: string;
    effect: 'allow' | 'deny';
    target: Record<string, any>;
    conditions: any[];
    priority: number;
    is_active: boolean;
  }>): Promise<void> {
    await db
      .update(abacPolicies)
      .set({
        ...updates,
        ...(updates.target && { target: JSON.stringify(updates.target) }),
        ...(updates.conditions && { conditions: JSON.stringify(updates.conditions) }),
        updated_at: new Date().toISOString()
      })
      .where(eq(abacPolicies.id, policyId));
  }
  
  /**
   * Delete policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    await db
      .delete(abacPolicies)
      .where(eq(abacPolicies.id, policyId));
  }
  
  /**
   * Get policy by ID
   */
  async getPolicy(policyId: string): Promise<any> {
    const [policy] = await db
      .select()
      .from(abacPolicies)
      .where(eq(abacPolicies.id, policyId));
    
    if (policy) {
      return {
        ...policy,
        target: JSON.parse(policy.target),
        conditions: JSON.parse(policy.conditions)
      };
    }
    
    return null;
  }
  
  /**
   * List all policies
   */
  async listPolicies(filters?: { isActive?: boolean }): Promise<any[]> {
    let query = db.select().from(abacPolicies);
    
    if (filters?.isActive !== undefined) {
      query = query.where(eq(abacPolicies.is_active, filters.isActive));
    }
    
    const policies = await query.orderBy(abacPolicies.priority);
    
    return policies.map(policy => ({
      ...policy,
      target: JSON.parse(policy.target),
      conditions: JSON.parse(policy.conditions)
    }));
  }
}

export const policyManager = new PolicyManager();
```

### 3. Middleware Integration

```typescript
// lib/auth/access-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { accessControlEngine } from './access-control';
import { getAuthSession } from './session';

export interface AccessControlConfig {
  resourceType: string;
  requiredAction: string;
  allowAnonymous?: boolean;
}

/**
 * Next.js middleware for access control
 */
export function createAccessControlMiddleware(config: AccessControlConfig) {
  return async (request: NextRequest) => {
    try {
      // Get authentication session
      const session = await getAuthSession();
      
      // Handle anonymous access
      if (!session && !config.allowAnonymous) {
        return NextResponse.redirect(new URL('/auth/signin', request.url));
      }
      
      // Skip access control for anonymous access when allowed
      if (!session && config.allowAnonymous) {
        return NextResponse.next();
      }
      
      // Create access request
      const accessRequest = {
        userId: session.userId,
        resourceId: request.nextUrl.pathname,
        resourceType: config.resourceType,
        action: config.requiredAction,
        environment: {
          ip: request.ip,
          userAgent: request.headers.get('user-agent') || undefined,
          timestamp: new Date(),
          location: request.geo?.country || undefined
        }
      };
      
      // Evaluate access
      const decision = await accessControlEngine.evaluateAccess(accessRequest);
      
      // Handle denied access
      if (!decision.granted) {
        return NextResponse.json(
          {
            error: 'Access denied',
            reason: decision.reason,
            advice: decision.advice
          },
          { status: 403 }
        );
      }
      
      // Create response with obligations
      const response = NextResponse.next();
      
      // Add obligations as headers or cookies
      if (decision.obligations) {
        decision.obligations.forEach(obligation => {
          switch (obligation.type) {
            case 'require_mfa':
              response.headers.set('X-Require-MFA', 'true');
              break;
            case 'log_access':
              // Log access (implementation depends on logging system)
              console.log(`Access logged: ${JSON.stringify({
                userId: session.userId,
                resourceId: accessRequest.resourceId,
                action: accessRequest.action,
                timestamp: new Date()
              })}`);
              break;
          }
        });
      }
      
      return response;
    } catch (error) {
      console.error('Access control middleware error:', error);
      return NextResponse.json(
        { error: 'Access control system error' },
        { status: 500 }
      );
    }
  };
}

/**
 * HOF for protecting API routes
 */
export function withAccessControl<T extends (...args: any[]) => any>(
  handler: T,
  config: AccessControlConfig
) {
  return async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    
    // Apply access control
    const middleware = createAccessControlMiddleware(config);
    const response = await middleware(request);
    
    // If access denied, return the response
    if (response.status !== 200 && response.status !== 304) {
      return response;
    }
    
    // Continue with original handler
    return handler(...args);
  };
}
```

### 4. React Hook for Client-Side Access Control

```typescript
// hooks/use-access-control.ts
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';

interface UseAccessControlOptions {
  resourceId: string;
  resourceType: string;
  action: string;
  autoCheck?: boolean;
}

interface AccessCheckResult {
  hasAccess: boolean;
  isLoading: boolean;
  error?: Error;
  decision?: any;
  checkAccess: () => Promise<void>;
}

export function useAccessControl(options: UseAccessControlOptions): AccessCheckResult {
  const { data: session } = useSession();
  const [decision, setDecision] = useState<any>(null);
  
  const {
    data: accessData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['access-control', options.resourceId, options.action],
    queryFn: async () => {
      if (!session?.user?.id) {
        return { hasAccess: false, reason: 'No session' };
      }
      
      const response = await fetch('/api/access-control/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          resourceId: options.resourceId,
          resourceType: options.resourceType,
          action: options.action
        })
      });
      
      if (!response.ok) {
        throw new Error('Access control check failed');
      }
      
      return response.json();
    },
    enabled: options.autoCheck && !!session?.user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const checkAccess = useCallback(async () => {
    if (!session?.user?.id) {
      setDecision({ hasAccess: false, reason: 'No session' });
      return;
    }
    
    try {
      const response = await fetch('/api/access-control/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          resourceId: options.resourceId,
          resourceType: options.resourceType,
          action: options.action
        })
      });
      
      const result = await response.json();
      setDecision(result);
    } catch (error) {
      setDecision({ hasAccess: false, reason: 'Check failed', error });
    }
  }, [session?.user?.id, options]);
  
  return {
    hasAccess: accessData?.granted || decision?.granted || false,
    isLoading,
    error: error as Error,
    decision: accessData || decision,
    checkAccess
  };
}
```

### 5. API Route for Access Control

```typescript
// app/api/access-control/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { accessControlEngine } from '@/lib/auth/access-control';
import { getAuthSession } from '@/lib/auth/session';
import { z } from 'zod';

const accessCheckSchema = z.object({
  userId: z.number().int().positive(),
  resourceId: z.string().min(1),
  resourceType: z.string().min(1),
  action: z.string().min(1),
  environment: z.object({
    ip: z.string().optional(),
    userAgent: z.string().optional(),
    timestamp: z.date().optional(),
    location: z.string().optional()
  }).optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const accessRequest = accessCheckSchema.parse({
      userId: session.userId,
      ...body
    });
    
    const decision = await accessControlEngine.evaluateAccess(accessRequest);
    
    return NextResponse.json(decision);
  } catch (error) {
    console.error('Access control check error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Security Considerations

### 1. Policy Security

#### Policy Injection Prevention
- Validate all policy conditions and targets
- Use parameterized queries for database operations
- Implement policy syntax validation
- Sanitize user input in policy creation

#### Privilege Escalation Prevention
- Implement least privilege principle
- Regular access reviews and audits
- Segregation of duties for policy management
- Multi-factor authentication for administrative actions

### 2. Data Protection

#### Sensitive Attribute Handling
- Encrypt sensitive user attributes at rest
- Implement attribute access logging
- Use secure attribute storage mechanisms
- Regular attribute data purging

#### Audit Trail Requirements
```
Access Control Audit Events:
- Policy creation/modification/deletion
- Role assignment changes
- Permission grant/revocation
- Access decision denials
- Administrative actions
- System configuration changes
```

### 3. System Hardening

#### Rate Limiting
- Implement API rate limiting for access control endpoints
- Add throttling for policy evaluation requests
- Monitor for abuse patterns

#### Input Validation
- Comprehensive validation of all access requests
- Schema validation for policy definitions
- Attribute value validation and sanitization

## Performance Implications

### 1. Database Optimization

#### Query Performance
- Implement efficient indexing strategies
- Use connection pooling for database access
- Optimize policy evaluation queries
- Implement query result caching

#### Caching Strategy
```typescript
// Example caching implementation
interface AccessControlCache {
  set(key: string, value: any, ttl: number): void;
  get(key: string): any;
  invalidate(pattern: string): void;
}

// Cache access decisions for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
```

### 2. Policy Evaluation Optimization

#### Policy Preprocessing
- Compile policies into efficient evaluation trees
- Cache policy evaluation results
- Implement policy grouping and prioritization
- Use efficient matching algorithms

#### Decision Caching
- Cache access decisions for repeated requests
- Implement cache invalidation on policy changes
- Use appropriate cache keys for decision lookup

### 3. Scalability Considerations

#### Horizontal Scaling
- Design for distributed policy evaluation
- Implement stateless access control services
- Use shared caching infrastructure
- Support multiple application instances

#### Performance Monitoring
```
Key Performance Metrics:
- Policy evaluation latency (target: <100ms)
- Database query performance
- Cache hit rates
- Memory usage patterns
- Concurrent request handling
```

## Integration with Existing Systems

### 1. Authentication System Integration

#### Session Management
```typescript
// Extend existing session system
interface AuthSession {
  userId: number;
  email: string;
  roles: string[];
  permissions: string[];
  lastActivity: Date;
  mfaEnabled: boolean;
  // New attributes for ABAC
  department?: string;
  location?: string;
  clearanceLevel?: string;
}
```

#### JWT Token Enhancement
```typescript
// Enhanced JWT payload for access control
interface AccessControlJWT {
  userId: number;
  roles: string[];
  permissions: string[];
  attributes: {
    department: string;
    location: string;
    clearanceLevel: string;
    accountStatus: string;
  };
  exp: number;
  iat: number;
}
```

### 2. Database Integration

#### Schema Migration Strategy
```sql
-- Migration script for RBAC tables
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  hierarchy_level INTEGER DEFAULT 1,
  parent_role_id INTEGER,
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Migration script for ABAC tables
CREATE TABLE IF NOT EXISTS abac_policies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  effect TEXT NOT NULL CHECK(effect IN ('allow', 'deny')),
  conditions TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  target TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Component Integration

#### Protected Component Wrapper
```typescript
// components/ProtectedComponent.tsx
import { useAccessControl } from '@/hooks/use-access-control';
import { AccessDenied } from '@/components/AccessDenied';

interface ProtectedComponentProps {
  resourceId: string;
  resourceType: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showErrorPage?: boolean;
}

export function ProtectedComponent({ 
  resourceId, 
  resourceType, 
  action, 
  children,
  fallback,
  showErrorPage = true
}: ProtectedComponentProps) {
  const { hasAccess, isLoading, error } = useAccessControl({
    resourceId,
    resourceType,
    action,
    autoCheck: true
  });
  
  if (isLoading) {
    return fallback || <div>Loading...</div>;
  }
  
  if (error) {
    return <div>Error checking access permissions</div>;
  }
  
  if (!hasAccess) {
    if (showErrorPage) {
      return <AccessDenied reason="You don't have access to this resource" />;
    }
    return fallback || null;
  }
  
  return <>{children}</>;
}
```

### 4. Development Workflow Integration

#### Policy Development Process
1. **Policy Design**: Define policy requirements and conditions
2. **Testing**: Test policies in development environment
3. **Review**: Code review and security review
4. **Deployment**: Deploy to staging environment
5. **Validation**: Validate in staging with real data
6. **Production**: Deploy to production with monitoring

#### Development Tools
```typescript
// Development policy testing utility
export class PolicyTester {
  async testPolicy(
    policyId: string,
    testScenarios: Array<{
      userId: number;
      resourceId: string;
      resourceType: string;
      action: string;
      environment?: any;
      expected: boolean;
    }>
  ): Promise<Array<{ scenario: any; actual: boolean; passed: boolean }>> {
    // Implementation for policy testing
  }
}
```

This comprehensive specification provides the foundation for implementing a robust, scalable, and secure hybrid RBAC+ABAC access control system in the Next.js 16 TypeScript application. The implementation integrates seamlessly with the existing authentication system while providing advanced access control capabilities.