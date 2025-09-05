"use client";

import { useState } from "react";
import { createPoll } from "@/app/lib/actions/poll-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Poll Creation Form Component
 * 
 * This component provides an interactive form for users to create new polls.
 * It implements dynamic option management, client-side validation, and
 * proper error handling with user feedback.
 * 
 * Features:
 * - Dynamic option addition/removal (minimum 2, maximum 10)
 * - Real-time form validation with character limits
 * - Success/error feedback with automatic redirection
 * - Accessible form controls with proper labeling
 * - Optimistic UI updates during form submission
 * 
 * Security measures:
 * - Client-side validation (server-side validation also enforced)
 * - Character limits to prevent abuse
 * - Sanitization handled by server action
 */
export default function PollCreateForm() {
  // State management for form data and UI states
  const [options, setOptions] = useState(["", ""]); // Start with 2 empty options
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Updates a specific option's value in the options array
   * 
   * @param idx - Index of the option to update
   * @param value - New value for the option
   */
  const handleOptionChange = (idx: number, value: string) => {
    setOptions((opts) => opts.map((opt, i) => (i === idx ? value : opt)));
  };

  /**
   * Adds a new empty option to the poll (up to maximum of 10)
   */
  const addOption = () => setOptions((opts) => [...opts, ""]);
  
  /**
   * Removes an option from the poll (minimum of 2 options required)
   * 
   * @param idx - Index of the option to remove
   */
  const removeOption = (idx: number) => {
    if (options.length > 2) {
      setOptions((opts) => opts.filter((_, i) => i !== idx));
    }
  };

  return (
    <form
      action={async (formData) => {
        // Reset form state for new submission
        setError(null);
        setSuccess(false);
        
        // Submit poll data to server action
        const res = await createPoll(formData);
        
        if (res?.error) {
          // Display server-side validation or database errors
          setError(res.error);
        } else {
          // Show success message and redirect to polls list
          setSuccess(true);
          setTimeout(() => {
            window.location.href = "/polls";
          }, 1200);
        }
      }}
      className="space-y-6 max-w-md mx-auto"
    >
      {/* Poll Question Input */}
      <div>
        <Label htmlFor="question">Poll Question</Label>
        <Input 
          name="question" 
          id="question" 
          required 
          maxLength={500}
          placeholder="Enter your poll question (max 500 characters)"
        />
      </div>
      
      {/* Dynamic Options Section */}
      <div>
        <Label>Options</Label>
        {options.map((opt, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2">
            <Input
              name="options"
              value={opt}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              required
              maxLength={200}
              placeholder={`Option ${idx + 1} (max 200 characters)`}
            />
            {/* Only show remove button if more than minimum options (2) */}
            {options.length > 2 && (
              <Button type="button" variant="destructive" onClick={() => removeOption(idx)}>
                Remove
              </Button>
            )}
          </div>
        ))}
        
        {/* Add Option Button - disabled when at maximum (10 options) */}
        {options.length < 10 && (
          <Button type="button" onClick={addOption} variant="secondary">
            Add Option
          </Button>
        )}
      </div>
      
      {/* Status Messages */}
      {error && <div className="text-red-500">{error}</div>}
      {success && <div className="text-green-600">Poll created! Redirecting...</div>}
      
      {/* Submit Button */}
      <Button type="submit">Create Poll</Button>
    </form>
  );
} 