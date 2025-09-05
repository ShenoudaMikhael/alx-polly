'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Authenticates a user with email and password
 * 
 * This function handles the user login process by validating credentials
 * against the Supabase authentication service. It creates a new session
 * for successful logins and returns appropriate error messages for failures.
 * 
 * @param data - Login form data containing email and password
 * @returns Promise<{error: string | null}> - Success or error response
 * 
 * Security considerations:
 * - Uses Supabase's built-in authentication with secure password hashing
 * - Password validation and rate limiting handled by Supabase
 * - Session tokens are automatically managed by Supabase client
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // Attempt to sign in with provided credentials
  // Supabase handles password verification and session creation
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    // Return user-friendly error message (sensitive details filtered by Supabase)
    return { error: error.message };
  }

  // Success: authentication complete, session established
  return { error: null };
}

/**
 * Registers a new user account
 * 
 * Creates a new user account in the Supabase authentication system with
 * email verification enabled. The user's profile data (name) is stored
 * in the auth metadata for easy access across the application.
 * 
 * @param data - Registration form data containing name, email, and password
 * @returns Promise<{error: string | null}> - Success or error response
 * 
 * Security considerations:
 * - Email verification may be required (configured in Supabase settings)
 * - Password strength requirements enforced by Supabase
 * - User metadata stored securely in auth.users table
 * - Duplicate email addresses automatically rejected
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Create new user account with email and password
  // Additional user data stored in auth metadata
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name, // Store user's display name in auth metadata
      },
    },
  });

  if (error) {
    // Return user-friendly error (e.g., "User already registered", "Weak password")
    return { error: error.message };
  }

  // Success: user account created (may need email verification)
  return { error: null };
}

/**
 * Signs out the current user
 * 
 * Terminates the user's session and clears all authentication tokens.
 * This function should be called when users explicitly log out or when
 * security requires session termination.
 * 
 * @returns Promise<{error: string | null}> - Success or error response
 * 
 * Security considerations:
 * - Invalidates session tokens on both client and server
 * - Clears all authentication cookies
 * - Redirects should be handled by calling component
 */
export async function logout() {
  const supabase = await createClient();
  
  // Terminate user session and clear authentication tokens
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { error: error.message };
  }
  
  return { error: null };
}

/**
 * Retrieves the currently authenticated user
 * 
 * Fetches user information from the current session. This function
 * validates the session token and returns user data if authenticated.
 * Returns null if no valid session exists.
 * 
 * @returns Promise<User | null> - User object or null if not authenticated
 * 
 * Usage: Use this for server-side authentication checks and user data access
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  
  // Get user from current session (validates token automatically)
  const { data } = await supabase.auth.getUser();
  
  return data.user;
}

/**
 * Retrieves the current session information
 * 
 * Gets the complete session object including access tokens, refresh tokens,
 * and expiration data. Useful for session management and token refresh.
 * 
 * @returns Promise<Session | null> - Session object or null if no active session
 * 
 * Usage: Use this when you need complete session data, not just user info
 */
export async function getSession() {
  const supabase = await createClient();
  
  // Get complete session data including tokens and expiration
  const { data } = await supabase.auth.getSession();
  
  return data.session;
}
