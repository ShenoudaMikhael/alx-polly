'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Authentication Context for ALX Polly Application
 * 
 * This context provides centralized authentication state management across
 * the application. It handles user sessions, authentication state changes,
 * and provides utilities for authentication-related operations.
 * 
 * Features:
 * - Real-time authentication state updates
 * - Session management with automatic token refresh
 * - Loading states for better UX
 * - Secure sign-out functionality
 * - Memory cleanup to prevent leaks
 */

/**
 * Authentication context interface defining available auth data and methods
 */
const AuthContext = createContext<{ 
  session: Session | null;    // Current user session with tokens
  user: User | null;          // Current user data
  signOut: () => void;        // Function to sign out user
  loading: boolean;           // Loading state for auth operations
}>({ 
  session: null, 
  user: null,
  signOut: () => {},
  loading: true,
});

/**
 * Authentication Provider Component
 * 
 * Wraps the application to provide authentication state and functions
 * to all child components. Manages Supabase auth state and automatically
 * updates when the user's authentication status changes.
 * 
 * @param children - React components that need access to auth context
 * 
 * Security considerations:
 * - Memoizes Supabase client to prevent unnecessary recreations
 * - Handles auth state changes in real-time
 * - Cleans up event listeners to prevent memory leaks
 * - Implements component unmount protection
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Memoize Supabase client to prevent recreation on every render
  const supabase = useMemo(() => createClient(), []);
  
  // Authentication state variables
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true; // Flag to prevent state updates after unmount
    
    /**
     * Fetches the current user from Supabase auth
     * Called on component mount to initialize auth state
     */
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error fetching user:', error);
      }
      
      // Only update state if component is still mounted
      if (mounted) {
        setUser(data.user ?? null);
        setSession(null); // Initial session is set via auth state change listener
        setLoading(false);
        // Removed sensitive logging for security
      }
    };

    // Initialize auth state
    getUser();

    /**
     * Set up authentication state change listener
     * Automatically updates auth state when user signs in/out or session changes
     */
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Loading state only changed on initial load, not on auth changes
      // Removed sensitive logging for security
    });

    // Cleanup function to prevent memory leaks
    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Signs out the current user
   * 
   * Terminates the user's session and clears authentication state.
   * This will trigger the auth state change listener to update the UI.
   */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access authentication context
 * 
 * Provides a convenient way to access authentication state and functions
 * from any component within the AuthProvider tree.
 * 
 * @returns Authentication context object with session, user, signOut, and loading
 * 
 * Usage example:
 * ```tsx
 * const { user, loading, signOut } = useAuth();
 * 
 * if (loading) return <div>Loading...</div>;
 * if (!user) return <LoginForm />;
 * return <Dashboard user={user} onSignOut={signOut} />;
 * ```
 */
export const useAuth = () => useContext(AuthContext);
