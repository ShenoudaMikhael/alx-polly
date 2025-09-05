"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { deletePoll } from "@/app/lib/actions/poll-actions";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/lib/context/auth-context";
import { useRouter } from "next/navigation";

/**
 * Poll interface for admin panel data structure
 */
interface Poll {
  id: string;
  question: string;
  user_id: string;
  created_at: string;
  options: string[];
}

/**
 * Admin Dashboard Component
 * 
 * This component provides administrative functionality for managing polls
 * across the entire application. It includes access control, poll management,
 * and comprehensive poll information display.
 * 
 * Features:
 * - Admin access control with multiple authentication methods
 * - System-wide poll overview with metadata
 * - Bulk poll management capabilities
 * - Real-time loading states and error handling
 * - Responsive design with detailed poll information
 * 
 * Security considerations:
 * - Multi-level admin authentication (email-based and metadata-based)
 * - Automatic redirection for unauthorized users
 * - Server-side authorization for delete operations
 * - Safe handling of authentication state changes
 */
export default function AdminPage() {
  // Authentication and routing hooks
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // Component state management
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  /**
   * Effect hook for authentication and authorization
   * 
   * Handles user authentication state and determines admin privileges.
   * Redirects unauthorized users to appropriate pages.
   */
  useEffect(() => {
    if (!authLoading && user) {
      // Multi-level admin privilege checking
      // 1. Predefined admin email addresses
      const adminEmails = ['admin@alxpolly.com', 'admin@example.com'];
      
      // 2. Email pattern matching (contains 'admin')
      // 3. Role-based authentication via user metadata
      const userIsAdmin = adminEmails.includes(user.email || '') || 
                         user.email?.includes('admin') || 
                         user.app_metadata?.role === 'admin';
      
      if (userIsAdmin) {
        setIsAdmin(true);
        fetchAllPolls(); // Load poll data for authorized admin
      } else {
        // Redirect non-admin users to polls page
        router.push('/polls');
      }
    } else if (!authLoading && !user) {
      // Redirect unauthenticated users to login
      router.push('/login');
    }
  }, [user, authLoading, router]);

  /**
   * Fetches all polls from the database for admin overview
   * 
   * Retrieves comprehensive poll data including metadata and options.
   * This function bypasses user-specific filtering for administrative access.
   */
  const fetchAllPolls = async () => {
    const supabase = createClient();

    // Fetch all polls in the system (admin privilege)
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPolls(data);
    }
    setLoading(false);
  };

  /**
   * Handles poll deletion from admin panel
   * 
   * Provides admin-level poll deletion with optimistic UI updates.
   * Manages loading states and removes deleted polls from the local state.
   * 
   * @param pollId - ID of the poll to delete
   */
  const handleDelete = async (pollId: string) => {
    setDeleteLoading(pollId); // Show loading state for specific poll
    
    const result = await deletePoll(pollId);

    if (!result.error) {
      // Optimistically update the UI by removing the deleted poll
      setPolls(polls.filter((poll) => poll.id !== pollId));
    }

    setDeleteLoading(null); // Clear loading state
  };

  // Loading states during authentication and data fetching
  if (authLoading || loading) {
    return <div className="p-6">Loading...</div>;
  }

  // Access denied screen for non-admin users
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Admin panel header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-gray-600 mt-2">
          View and manage all polls in the system.
        </p>
      </div>

      {/* Poll management grid */}
      <div className="grid gap-4">
        {polls.map((poll) => (
          <Card key={poll.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{poll.question}</CardTitle>
                  <CardDescription>
                    <div className="space-y-1 mt-2">
                      {/* Poll metadata for admin reference */}
                      <div>
                        Poll ID:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {poll.id}
                        </code>
                      </div>
                      <div>
                        Owner ID:{" "}
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {poll.user_id}
                        </code>
                      </div>
                      <div>
                        Created:{" "}
                        {new Date(poll.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </CardDescription>
                </div>
                
                {/* Delete button with loading state */}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(poll.id)}
                  disabled={deleteLoading === poll.id}
                >
                  {deleteLoading === poll.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </CardHeader>
            
            {/* Poll options display */}
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium">Options:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {poll.options.map((option, index) => (
                    <li key={index} className="text-gray-700">
                      {option}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state for when no polls exist */}
      {polls.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No polls found in the system.
        </div>
      )}
    </div>
  );
}
