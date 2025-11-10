'use server';

import { redirect } from 'next/navigation';
import { getSession, setSession, clearSession } from '@/lib/auth/session';
import { 
  getUserByEmail, 
  verifyUserPassword, 
  createUser, 
  updateUserLastLogin,
  getUserById
} from '@/lib/db/query';
import { User } from '@/lib/db/schema';
import { ActionState } from '@/lib/auth/middleware';
import { signInSchema, signUpSchemaWithTerms, parseFormData } from '@/lib/types/type';

// ================================
// SERVER ACTIONS
// ================================

/**
 * Sign in action - validates credentials and creates session
 */
export async function signIn(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const rawData = parseFormData(formData);
    
    // Validate form data
    const result = signInSchema.safeParse(rawData);
    if (!result.success) {
      return {
        error: result.error.issues[0].message,
        email: rawData.email as string || ''
      };
    }

    const { email, password } = result.data;
    
    // Verify user credentials
    const user = await verifyUserPassword(email, password);
    if (!user) {
      return { 
        error: 'Invalid email or password',
        email: email 
      };
    }

    // Check if user is active
    if (!user.isActive) {
      return { 
        error: 'Account is deactivated. Please contact support.',
        email: email 
      };
    }

    // Update last login
    await updateUserLastLogin(user.id);

    // Create session
    await setSession(user);

    // Note: The actual cookie maxAge is set in setSession function
    // For remember me functionality, we could extend the session duration here if needed

    // Return success state for client-side redirect
    console.log('User signed in successfully:', user.email);
    return {
      success: true,
      message: 'Sign in successful',
      email: email
    };
    
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      error: 'An unexpected error occurred. Please try again.',
      email: (formData.get('email') as string) || ''
    };
  }
}
/**
 * Sign up action - creates new user and session
 */
export async function signUp(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  try {
    const rawData = parseFormData(formData);
    
    // Validate form data
    const result = signUpSchemaWithTerms.safeParse(rawData);
    if (!result.success) {
      return {
        error: result.error.issues[0].message,
        name: rawData.name as string || '',
        email: rawData.email as string || ''
      };
    }

    const { name, email, password } = result.data;
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return {
        error: 'An account with this email already exists',
        name,
        email
      };
    }

    // Create new user
    const newUser = await createUser(
      {
        name,
        email,
        isActive: true,
        department: null,
        location: null,
        clearanceLevel: 'standard',
        accountStatus: 'active'
      },
      password
    );

    if (!newUser || newUser.length === 0) {
      return {
        error: 'Failed to create account. Please try again.',
        name,
        email
      };
    }

    // Create session for the new user
    await setSession(newUser[0]);

    // Return success state for client-side redirect
    return {
      success: true,
      message: 'Account created successfully',
      name: name,
      email: email
    };
    
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      error: 'An unexpected error occurred. Please try again.',
      name: (formData.get('name') as string) || '',
      email: (formData.get('email') as string) || ''
    };
  }
}

/**
 * Logout action - clears session and redirects to sign in
 */
export async function logout() {
  try {
    await clearSession();
    redirect('/signin');
  } catch (error) {
    console.error('Logout error:', error);
    // Even if there's an error, redirect to sign in
    redirect('/signin');
  }
}

/**
 * Check authentication status
 */
export async function checkAuthStatus() {
  try {
    const session = await getSession();
    return {
      isAuthenticated: !!session,
      user: session?.user || null
    };
  } catch (error) {
    console.error('Auth status check error:', error);
    return {
      isAuthenticated: false,
      user: null
    };
  }
}

/**
 * Get current user (for client components)
 */
export async function getCurrentUser(): Promise<User | null> {
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