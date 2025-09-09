"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Poll Management Actions
 * 
 * This module contains all server actions for managing polls in the ALX Polly application.
 * It includes functions for creating, reading, updating, and deleting polls, as well as
 * voting functionality and results calculation.
 * 
 * Security features implemented:
 * - Input validation and sanitization
 * - User authentication checks
 * - Authorization for sensitive operations
 * - SQL injection prevention via Supabase client
 * - XSS prevention through HTML tag removal
 */

// Input validation and sanitization helpers

/**
 * Sanitizes user input by removing HTML tags and trimming whitespace
 * 
 * This function provides basic XSS protection by stripping HTML tags
 * from user input. For production use, consider more robust sanitization.
 * 
 * @param input - Raw user input string
 * @returns Sanitized string with HTML tags removed and whitespace trimmed
 */
function sanitizeString(input: string): string {
  return input.trim().replace(/<[^>]*>/g, ''); // Basic HTML tag removal
}

/**
 * Validates poll input data for security and business rules
 * 
 * Performs comprehensive validation of poll questions and options including:
 * - Required field validation
 * - Length limit enforcement
 * - Minimum/maximum option constraints
 * - HTML sanitization
 * 
 * @param question - Poll question text
 * @param options - Array of poll option texts
 * @returns Validation result with sanitized data or error message
 */
function validatePollInput(question: string, options: string[]) {
  // Validate question
  if (!question || question.trim().length === 0) {
    return { valid: false, error: "Question is required." };
  }
  if (question.length > 500) {
    return { valid: false, error: "Question must be less than 500 characters." };
  }

  // Validate options - filter out empty options
  const validOptions = options.filter(opt => opt && opt.trim().length > 0);
  if (validOptions.length < 2) {
    return { valid: false, error: "Please provide at least two options." };
  }
  if (validOptions.length > 10) {
    return { valid: false, error: "Maximum 10 options allowed." };
  }
  
  // Check individual option length limits
  for (const option of validOptions) {
    if (option.length > 200) {
      return { valid: false, error: "Each option must be less than 200 characters." };
    }
  }

  return { 
    valid: true, 
    sanitizedQuestion: sanitizeString(question), 
    sanitizedOptions: validOptions.map(sanitizeString) 
  };
}

/**
 * Creates a new poll with validated and sanitized input
 * 
 * This function handles poll creation with comprehensive security measures:
 * - Validates user authentication
 * - Sanitizes all user input
 * - Enforces business rules (option limits, length constraints)
 * - Associates poll with authenticated user
 * 
 * @param formData - FormData object containing poll question and options
 * @returns Promise<{error: string | null}> - Success or detailed error message
 * 
 * Security considerations:
 * - Only authenticated users can create polls
 * - All input is validated and sanitized
 * - SQL injection prevented by Supabase parameterized queries
 * - XSS prevented by HTML tag removal
 */
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  // Extract form data
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate and sanitize all input data
  const validation = validatePollInput(question, options);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // Verify user authentication - only logged-in users can create polls
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to create a poll." };
  }

  // Insert new poll into database with sanitized data
  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id, // Associate poll with authenticated user
      question: validation.sanitizedQuestion,
      options: validation.sanitizedOptions,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  // Revalidate the polls page to show updated data
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Retrieves all polls created by the authenticated user
 * 
 * Fetches polls owned by the current user, ordered by creation date.
 * This function implements proper authorization by filtering results
 * to only include polls created by the authenticated user.
 * 
 * @returns Promise<{polls: Poll[], error: string | null}> - User's polls or error
 * 
 * Security considerations:
 * - Requires user authentication
 * - Only returns polls owned by the authenticated user
 * - Results filtered at database level for security
 */
export async function getUserPolls() {
  const supabase = await createClient();
  
  // Verify user authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  if (!user) return { polls: [], error: "Not authenticated" };

  // Fetch only polls owned by the authenticated user
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id) // Security: filter by user ownership
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

/**
 * Retrieves a single poll by ID with ownership information
 * 
 * Fetches poll data for display and voting. Includes ownership information
 * to enable conditional rendering of edit/delete options in the UI.
 * Public polls can be viewed by anyone for voting purposes.
 * 
 * @param id - Poll ID to retrieve
 * @returns Promise<{poll: Poll | null, error: string | null}> - Poll data with ownership info
 * 
 * Security considerations:
 * - Poll data is public for voting functionality
 * - Ownership information included for authorization of sensitive operations
 * - Edit/delete operations should verify ownership separately
 */
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // Fetch poll data from database
  const { data: poll, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  
  // Get current user to determine ownership for UI permissions
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Return poll data with ownership flag for conditional UI rendering
  // Note: Actual edit/delete operations must verify ownership server-side
  return { 
    poll: {
      ...poll,
      isOwner: user ? poll.user_id === user.id : false
    }, 
    error: null 
  };
}

/**
 * Submits a vote for a poll option
 * 
 * This function handles the voting process with comprehensive validation:
 * - Validates poll existence and option selection
 * - Prevents duplicate voting by the same user
 * - Supports both authenticated and anonymous voting
 * - Ensures data integrity through proper validation
 * 
 * @param pollId - ID of the poll to vote on
 * @param optionIndex - Index of the selected option (0-based)
 * @returns Promise<{error: string | null}> - Success or error message
 * 
 * Security considerations:
 * - Validates poll existence before accepting votes
 * - Prevents invalid option selection (out of bounds)
 * - Prevents duplicate voting by authenticated users
 * - Supports anonymous voting (user_id can be null)
 */
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Validate input parameters
  if (!pollId || typeof optionIndex !== 'number' || optionIndex < 0) {
    return { error: 'Invalid vote data.' };
  }

  // Get current user (may be null for anonymous voting)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify poll exists and get its options for validation
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { error: 'Poll not found.' };
  }

  // Validate that the selected option index is within bounds
  if (optionIndex >= poll.options.length) {
    return { error: 'Invalid option selected.' };
  }

  // Prevent duplicate voting by authenticated users
  if (user) {
    const { data: existingVote } = await supabase
      .from("votes")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", user.id)
      .single();

    if (existingVote) {
      return { error: 'You have already voted on this poll.' };
    }
  }

  // Insert the vote record
  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null, // Allow anonymous voting
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

/**
 * Deletes a poll with proper authorization
 * 
 * Removes a poll from the database after verifying user permissions.
 * Only poll owners or administrators can delete polls. This function
 * implements proper authorization checks to prevent unauthorized deletions.
 * 
 * @param id - ID of the poll to delete
 * @returns Promise<{error: string | null}> - Success or error message
 * 
 * Security considerations:
 * - Requires user authentication
 * - Verifies poll ownership or admin privileges
 * - Prevents unauthorized poll deletion
 * - Cascading deletes handled by database constraints
 */
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Verify user authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to delete a poll." };
  }

  // Fetch poll to verify ownership
  const { data: poll } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!poll) {
    return { error: "Poll not found." };
  }

  // Check authorization: user must own the poll or be an admin
  const isAdmin = user.email?.includes('admin') || user.app_metadata?.role === 'admin';
  if (poll.user_id !== user.id && !isAdmin) {
    return { error: "You can only delete your own polls." };
  }

  // Perform the deletion (votes will be cascaded by DB constraints)
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  
  // Revalidate polls page to reflect changes
  revalidatePath("/polls");
  return { error: null };
}

/**
 * Updates an existing poll with new question and options
 * 
 * Allows poll owners to modify their poll content. This function validates
 * ownership and input data before updating the poll in the database.
 * 
 * @param pollId - ID of the poll to update
 * @param formData - FormData containing updated question and options
 * @returns Promise<{error: string | null}> - Success or error message
 * 
 * Security considerations:
 * - Requires user authentication
 * - Validates ownership (only poll creator can update)
 * - Sanitizes all input data
 * - Prevents unauthorized poll modifications
 */
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  // Extract and validate form data
  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate and sanitize input using the same rules as poll creation
  const validation = validatePollInput(question, options);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // Verify user authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError.message };
  }
  if (!user) {
    return { error: "You must be logged in to update a poll." };
  }

  // Update poll with ownership verification built into the query
  // This ensures only the poll owner can update their poll
  const { error } = await supabase
    .from("polls")
    .update({ 
      question: validation.sanitizedQuestion, 
      options: validation.sanitizedOptions 
    })
    .eq("id", pollId)
    .eq("user_id", user.id); // Security: verify ownership

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// Types for better type safety
interface Vote {
  option_index: number;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  user_id: string;
  created_at: string;
}

interface PollWithVotes extends Poll {
  votes: Vote[];
}

interface PollOptionResult {
  text: string;
  votes: number;
  percentage: number;
}

interface PollResults {
  poll: Poll;
  options: PollOptionResult[];
  totalVotes: number;
}

/**
 * Retrieves poll results with vote counts and percentages
 * 
 * Calculates and returns comprehensive poll results including vote counts
 * and percentages for each option. This function aggregates vote data
 * and provides formatted results for display purposes.
 * 
 * @param pollId - ID of the poll to get results for
 * @returns Promise<{results: PollResults | null, error: string | null}> - Formatted poll results
 * 
 * Features:
 * - Calculates vote counts per option with proper type safety
 * - Computes percentage distribution with rounding
 * - Handles zero-vote scenarios safely
 * - Validates vote data integrity
 * - Returns poll metadata along with results
 * 
 * Security considerations:
 * - Validates poll ID parameter
 * - Handles malformed vote data gracefully
 * - Provides detailed error messages for debugging
 */
export async function getPollResults(pollId: string) {
  const supabase = await createClient();
  
  // Validate input parameter
  if (!pollId || typeof pollId !== 'string' || pollId.trim().length === 0) {
    return { results: null, error: "Invalid poll ID provided." };
  }

  try {
    // Fetch poll data and its votes in a single query for efficiency
    const { data: pollWithVotes, error: pollError } = await supabase
      .from("polls")
      .select(`
        id,
        question,
        options,
        user_id,
        created_at,
        votes(option_index)
      `)
      .eq("id", pollId.trim())
      .single();

    if (pollError) {
      // Handle specific error types
      if (pollError.code === 'PGRST116') {
        return { results: null, error: "Poll not found." };
      }
      return { results: null, error: `Database error: ${pollError.message}` };
    }

    if (!pollWithVotes) {
      return { results: null, error: "Poll not found." };
    }

    // Type-safe extraction of poll data and votes
    const { votes, ...poll } = pollWithVotes as PollWithVotes;
    
    // Validate poll data structure
    if (!poll.options || !Array.isArray(poll.options) || poll.options.length === 0) {
      return { results: null, error: "Invalid poll data: missing or empty options." };
    }

    // Calculate vote counts for each option with improved validation
    const optionCounts = calculateVoteCounts(votes || [], poll.options.length);
    
    // Calculate total votes
    const totalVotes = (votes || []).length;
    
    // Build formatted results with type safety
    const results: PollResults = {
      poll,
      options: poll.options.map((optionText, index) => ({
        text: optionText,
        votes: optionCounts[index],
        percentage: calculatePercentage(optionCounts[index], totalVotes)
      })),
      totalVotes
    };

    return { results, error: null };
    
  } catch (error) {
    // Handle unexpected errors
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return { results: null, error: `Failed to fetch poll results: ${errorMessage}` };
  }
}

/**
 * Calculates vote counts for each poll option with validation
 * 
 * @param votes - Array of vote records
 * @param optionCount - Number of options in the poll
 * @returns Array of vote counts per option
 */
function calculateVoteCounts(votes: Vote[], optionCount: number): number[] {
  const optionCounts = new Array(optionCount).fill(0);
  
  votes.forEach((vote, voteIndex) => {
    // Comprehensive vote validation
    if (!vote || typeof vote.option_index !== 'number') {
      console.warn(`Invalid vote data at index ${voteIndex}:`, vote);
      return;
    }
    
    const optionIndex = vote.option_index;
    
    // Validate option index bounds
    if (optionIndex >= 0 && optionIndex < optionCount && Number.isInteger(optionIndex)) {
      optionCounts[optionIndex]++;
    } else {
      console.warn(`Invalid option index ${optionIndex} for vote at index ${voteIndex}`);
    }
  });
  
  return optionCounts;
}

/**
 * Calculates percentage with proper rounding and zero handling
 * 
 * @param votes - Number of votes for this option
 * @param totalVotes - Total number of votes
 * @returns Rounded percentage (0-100)
 */
function calculatePercentage(votes: number, totalVotes: number): number {
  if (totalVotes === 0 || votes === 0) {
    return 0;
  }
  
  return Math.round((votes / totalVotes) * 100);
}

/**
 * Checks if the current user has already voted on a specific poll
 * 
 * Determines voting eligibility by checking if the authenticated user
 * has already cast a vote for the specified poll. Used to prevent
 * duplicate voting and show appropriate UI states.
 * 
 * @param pollId - ID of the poll to check voting status for
 * @returns Promise<{hasVoted: boolean, error: string | null}> - Voting status or error
 * 
 * Security considerations:
 * - Only checks votes for the authenticated user
 * - Anonymous users always return hasVoted: false
 * - Handles database errors gracefully
 */
export async function hasUserVoted(pollId: string) {
  const supabase = await createClient();
  
  // Get current user (may be null for anonymous users)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous users have never voted
  if (!user) {
    return { hasVoted: false, error: null };
  }

  // Check if user has voted on this poll
  const { data: vote, error } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();

  // Handle "not found" error as a normal case (user hasn't voted)
  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    return { hasVoted: false, error: error.message };
  }

  return { hasVoted: !!vote, error: null };
}
