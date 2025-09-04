"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Input validation and sanitization helpers
function sanitizeString(input: string): string {
  return input.trim().replace(/<[^>]*>/g, ''); // Basic HTML tag removal
}

function validatePollInput(question: string, options: string[]) {
  // Validate question
  if (!question || question.trim().length === 0) {
    return { valid: false, error: "Question is required." };
  }
  if (question.length > 500) {
    return { valid: false, error: "Question must be less than 500 characters." };
  }

  // Validate options
  const validOptions = options.filter(opt => opt && opt.trim().length > 0);
  if (validOptions.length < 2) {
    return { valid: false, error: "Please provide at least two options." };
  }
  if (validOptions.length > 10) {
    return { valid: false, error: "Maximum 10 options allowed." };
  }
  
  // Check option length
  for (const option of validOptions) {
    if (option.length > 200) {
      return { valid: false, error: "Each option must be less than 200 characters." };
    }
  }

  return { valid: true, sanitizedQuestion: sanitizeString(question), sanitizedOptions: validOptions.map(sanitizeString) };
}

// CREATE POLL
export async function createPoll(formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate and sanitize input
  const validation = validatePollInput(question, options);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // Get user from session
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

  const { error } = await supabase.from("polls").insert([
    {
      user_id: user.id,
      question: validation.sanitizedQuestion,
      options: validation.sanitizedOptions,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/polls");
  return { error: null };
}

// GET USER POLLS
export async function getUserPolls() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { polls: [], error: "Not authenticated" };

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return { polls: [], error: error.message };
  return { polls: data ?? [], error: null };
}

// GET POLL BY ID
export async function getPollById(id: string) {
  const supabase = await createClient();
  
  // First get the poll
  const { data: poll, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { poll: null, error: error.message };
  
  // Get current user to check ownership for sensitive operations
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Return poll data (public polls can be viewed by anyone for voting)
  // But include ownership info for edit/delete operations
  return { 
    poll: {
      ...poll,
      isOwner: user ? poll.user_id === user.id : false
    }, 
    error: null 
  };
}

// SUBMIT VOTE
export async function submitVote(pollId: string, optionIndex: number) {
  const supabase = await createClient();
  
  // Validate inputs
  if (!pollId || typeof optionIndex !== 'number' || optionIndex < 0) {
    return { error: 'Invalid vote data.' };
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Verify poll exists and get its options
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("options")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { error: 'Poll not found.' };
  }

  // Validate option index
  if (optionIndex >= poll.options.length) {
    return { error: 'Invalid option selected.' };
  }

  // Check if user already voted (prevent multiple votes)
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

  // Insert vote
  const { error } = await supabase.from("votes").insert([
    {
      poll_id: pollId,
      user_id: user?.id ?? null,
      option_index: optionIndex,
    },
  ]);

  if (error) return { error: error.message };
  return { error: null };
}

// DELETE POLL
export async function deletePoll(id: string) {
  const supabase = await createClient();
  
  // Get current user
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

  // Check if user owns the poll or is admin
  const { data: poll } = await supabase
    .from("polls")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!poll) {
    return { error: "Poll not found." };
  }

  // Allow deletion if user owns the poll or is admin
  const isAdmin = user.email?.includes('admin') || user.app_metadata?.role === 'admin';
  if (poll.user_id !== user.id && !isAdmin) {
    return { error: "You can only delete your own polls." };
  }

  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/polls");
  return { error: null };
}

// UPDATE POLL
export async function updatePoll(pollId: string, formData: FormData) {
  const supabase = await createClient();

  const question = formData.get("question") as string;
  const options = formData.getAll("options").filter(Boolean) as string[];

  // Validate and sanitize input
  const validation = validatePollInput(question, options);
  if (!validation.valid) {
    return { error: validation.error };
  }

  // Get user from session
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

  // Only allow updating polls owned by the user
  const { error } = await supabase
    .from("polls")
    .update({ 
      question: validation.sanitizedQuestion, 
      options: validation.sanitizedOptions 
    })
    .eq("id", pollId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

// GET POLL RESULTS
export async function getPollResults(pollId: string) {
  const supabase = await createClient();
  
  // Get poll data
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (pollError || !poll) {
    return { results: null, error: "Poll not found." };
  }

  // Get vote counts
  const { data: votes, error: votesError } = await supabase
    .from("votes")
    .select("option_index")
    .eq("poll_id", pollId);

  if (votesError) {
    return { results: null, error: votesError.message };
  }

  // Calculate results
  const optionCounts = new Array(poll.options.length).fill(0);
  votes?.forEach(vote => {
    if (vote.option_index < optionCounts.length) {
      optionCounts[vote.option_index]++;
    }
  });

  const totalVotes = votes?.length || 0;
  const results = {
    poll,
    options: poll.options.map((option: string, index: number) => ({
      text: option,
      votes: optionCounts[index],
      percentage: totalVotes > 0 ? Math.round((optionCounts[index] / totalVotes) * 100) : 0
    })),
    totalVotes
  };

  return { results, error: null };
}

// CHECK IF USER HAS VOTED
export async function hasUserVoted(pollId: string) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { hasVoted: false, error: null };
  }

  const { data: vote, error } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    return { hasVoted: false, error: error.message };
  }

  return { hasVoted: !!vote, error: null };
}
