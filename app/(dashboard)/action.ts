'use server';

import { redirect } from 'next/navigation';
import { getSession, clearSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/query';
import { User } from '@/lib/db/schema';
import { ActionState } from '@/lib/auth/middleware';
import { updateProfileSchema, changePasswordSchema, parseFormData } from '@/lib/types/type';

// ================================
// AUTHENTICATION ACTIONS
// ================================

/**
 * Logout action - clears session and redirects to sign in
 */
export async function logout() {
  console.log('Logging out user');
  await clearSession();
  redirect('/signin');
}

/**
 * Check authentication status for dashboard access
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    redirect('/signin');
  }
  return session;
}

/**
 * Get current user for dashboard components
 */
export async function getCurrentDashboardUser(): Promise<User | null> {
  try {
    const session = await getSession();
    if (!session) return null;
    
    const user = await getUserById(session.user.id);
    return user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Get dashboard statistics and overview data
 */
export async function getDashboardData() {
  try {
    const session = await requireAuth();
    const user = await getCurrentDashboardUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        data: null
      };
    }

    // This is a placeholder for actual dashboard data
    // In a real application, you would query the database for:
    // - User statistics
    // - Recent activities
    // - Access logs
    // - Role assignments
    // - Policy information
    const dashboardData = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        location: user.location,
        clearanceLevel: user.clearanceLevel,
        lastLogin: user.lastLogin,
      },
      statistics: {
        totalUsers: 0, // Would be queried from database
        activeRoles: 0, // Would be queried from database
        accessLogs: 0, // Would be queried from database
        policies: 0, // Would be queried from database
      },
      recentActivities: [
        // Would be populated from access_logs table
        {
          id: 1,
          action: 'Login',
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1',
        }
      ],
      quickActions: [
        {
          title: 'Update Profile',
          description: 'Update your personal information',
          href: '/dashboard/profile',
          icon: 'User',
        },
        {
          title: 'View Access Logs',
          description: 'Check your recent access history',
          href: '/dashboard/logs',
          icon: 'Shield',
        },
        {
          title: 'Change Password',
          description: 'Update your account password',
          href: '/dashboard/settings',
          icon: 'Lock',
        },
      ],
    };

    return {
      success: true,
      data: dashboardData
    };
  } catch (error) {
    console.error('Get dashboard data error:', error);
    return {
      success: false,
      error: 'Failed to load dashboard data',
      data: null
    };
  }
}

// ================================
// USER PROFILE ACTIONS
// ================================

/**
 * Update user profile information
 */
export async function updateProfile(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const session = await requireAuth();
    const user = await getCurrentDashboardUser();
    
    if (!user) {
      return { error: 'User not found' };
    }

    const rawData = parseFormData(formData);
    const { name, department, location } = rawData;

    // Validate input
    const result = updateProfileSchema.safeParse({
      name: name as string,
      department: department as string || undefined,
      location: location as string || undefined,
    });
    
    if (!result.success) {
      return {
        error: result.error.issues[0].message,
        name: name as string || user.name,
        email: user.email
      };
    }

    // In a real application, you would update the database here
    // For now, we'll just return success
    // await updateUser(user.id, result.data);

    return { 
      success: true, 
      message: 'Profile updated successfully' 
    };
  } catch (error) {
    console.error('Update profile error:', error);
    return {
      error: 'Failed to update profile. Please try again.'
    };
  }
}

/**
 * Change user password
 */
export async function changePassword(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const session = await requireAuth();
    const user = await getCurrentDashboardUser();
    
    if (!user) {
      return { error: 'User not found' };
    }

    const rawData = parseFormData(formData);
    const { currentPassword, newPassword, confirmPassword } = rawData;

    // Validate input
    const result = changePasswordSchema.safeParse({
      currentPassword: currentPassword as string,
      newPassword: newPassword as string,
      confirmPassword: confirmPassword as string,
    });
    
    if (!result.success) {
      return {
        error: result.error.issues[0].message,
      };
    }

    // In a real application, you would:
    // 1. Verify the current password
    // 2. Hash the new password
    // 3. Update the database
    // For now, we'll just return success
    // const { updateUserPassword } = await import('@/lib/db/query');
    // await updateUserPassword(user.id, result.data.newPassword);

    return { 
      success: true, 
      message: 'Password changed successfully' 
    };
  } catch (error) {
    console.error('Change password error:', error);
    return {
      error: 'Failed to change password. Please try again.'
    };
  }
}

// ================================
// ACCESS CONTROL ACTIONS
// ================================

/**
 * Get user access information for dashboard
 */
export async function getUserAccessInfo() {
  try {
    const session = await requireAuth();
    const user = await getCurrentDashboardUser();
    
    if (!user) {
      return {
        success: false,
        error: 'User not found',
        data: null
      };
    }

    // Placeholder for actual access control data
    // In a real application, you would query:
    // - User roles and permissions
    // - ABAC policies affecting the user
    // - Recent access decisions
    const accessInfo = {
      roles: [
        {
          id: 1,
          name: 'User',
          description: 'Standard user access',
          grantedAt: '2024-01-01T00:00:00Z',
        }
      ],
      permissions: [
        {
          id: 1,
          name: 'read_profile',
          description: 'Read own profile information',
          resource: 'profile',
          action: 'read',
        }
      ],
      policies: [
        {
          id: 'policy-1',
          name: 'Standard User Access',
          effect: 'allow',
          description: 'Standard access policy for regular users',
        }
      ],
      accessLogCount: 15,
    };

    return {
      success: true,
      data: accessInfo
    };
  } catch (error) {
    console.error('Get user access info error:', error);
    return {
      success: false,
      error: 'Failed to load access information',
      data: null
    };
  }
}