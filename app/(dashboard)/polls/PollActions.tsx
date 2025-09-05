"use client";

import Link from "next/link";
import { useAuth } from "@/app/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { deletePoll } from "@/app/lib/actions/poll-actions";

/**
 * Poll interface defining the structure of poll data
 */
interface Poll {
  id: string;
  question: string;
  options: any[];
  user_id: string;
}

/**
 * Props interface for the PollActions component
 */
interface PollActionsProps {
  poll: Poll;
}

/**
 * Poll Actions Component
 * 
 * This component renders a poll card with interactive actions for authenticated users.
 * It displays poll information and conditionally shows edit/delete buttons for poll owners.
 * 
 * Features:
 * - Clickable poll card that links to poll detail page
 * - Hover effects for better user experience
 * - Conditional rendering of action buttons based on ownership
 * - Delete confirmation dialog for safety
 * - Responsive design with proper spacing and layout
 * 
 * Security considerations:
 * - Only shows edit/delete buttons to poll owners
 * - Delete action includes user confirmation
 * - Client-side ownership check (server-side validation in deletePoll action)
 */
export default function PollActions({ poll }: PollActionsProps) {
  // Get current user from authentication context
  const { user } = useAuth();
  
  /**
   * Handles poll deletion with user confirmation
   * 
   * Shows a confirmation dialog before proceeding with deletion.
   * Refreshes the page after successful deletion to update the UI.
   * Error handling is managed by the server action.
   */
  const handleDelete = async () => {
    // Show confirmation dialog to prevent accidental deletions
    if (confirm("Are you sure you want to delete this poll?")) {
      await deletePoll(poll.id);
      // Refresh page to show updated poll list
      // TODO: Consider implementing optimistic updates for better UX
      window.location.reload();
    }
  };

  return (
    <div className="border rounded-md shadow-md hover:shadow-lg transition-shadow bg-white">
      {/* Main poll card - clickable area that navigates to poll detail */}
      <Link href={`/polls/${poll.id}`}>
        <div className="group p-4">
          <div className="h-full">
            <div>
              {/* Poll title with hover effect */}
              <h2 className="group-hover:text-blue-600 transition-colors font-bold text-lg">
                {poll.question}
              </h2>
              {/* Poll metadata */}
              <p className="text-slate-500">{poll.options.length} options</p>
            </div>
          </div>
        </div>
      </Link>
      
      {/* Action buttons - only visible to poll owners */}
      {user && user.id === poll.user_id && (
        <div className="flex gap-2 p-2">
          {/* Edit button */}
          <Button asChild variant="outline" size="sm">
            <Link href={`/polls/${poll.id}/edit`}>Edit</Link>
          </Button>
          
          {/* Delete button with confirmation */}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}
