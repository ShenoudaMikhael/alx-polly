/**
 * Type Definitions for ALX Polly Application
 * 
 * This file contains all TypeScript type definitions used throughout
 * the ALX Polly polling application. These types ensure type safety
 * and provide clear contracts for data structures and API interactions.
 */

// ============================================================================
// USER TYPES
// ============================================================================

/**
 * User interface representing a registered user in the system
 * 
 * This interface defines the structure of user data as stored in the database
 * and used throughout the application for authentication and user management.
 */
export interface User {
  id: string;           // Unique user identifier (UUID)
  name: string;         // User's display name
  email: string;        // User's email address (used for authentication)
  image?: string;       // Optional profile image URL
  createdAt: Date;      // Account creation timestamp
  updatedAt: Date;      // Last profile update timestamp
}

// ============================================================================
// POLL TYPES
// ============================================================================

/**
 * Poll option interface representing a single choice in a poll
 * 
 * Contains the option text and current vote count for results display
 */
export interface PollOption {
  id: string;           // Unique option identifier
  text: string;         // Option text content (max 200 characters)
  votes: number;        // Current number of votes for this option
}

/**
 * Complete poll interface representing a poll with all metadata
 * 
 * This is the main poll data structure used throughout the application
 * for poll creation, display, and management operations.
 */
export interface Poll {
  id: string;           // Unique poll identifier (UUID)
  title: string;        // Poll question/title (max 500 characters)
  description?: string; // Optional poll description
  options: PollOption[]; // Array of poll options (2-10 options)
  createdBy: string;    // User ID of poll creator
  createdAt: Date;      // Poll creation timestamp
  updatedAt: Date;      // Last poll update timestamp
  endDate?: Date;       // Optional poll expiration date
  settings: PollSettings; // Poll configuration settings
}

/**
 * Poll settings interface for configuring poll behavior
 * 
 * Defines various options that control how the poll functions
 * and who can participate in voting.
 */
export interface PollSettings {
  allowMultipleVotes: boolean;      // Whether users can vote multiple times
  requireAuthentication: boolean;   // Whether voting requires user login
}

// ============================================================================
// VOTE TYPES
// ============================================================================

/**
 * Vote interface representing a single vote cast by a user
 * 
 * Tracks individual votes for analytics and duplicate prevention.
 * User ID is optional to support anonymous voting scenarios.
 */
export interface Vote {
  id: string;           // Unique vote identifier (UUID)
  pollId: string;       // ID of the poll being voted on
  optionId: string;     // ID of the selected option
  userId?: string;      // Optional user ID (null for anonymous votes)
  createdAt: Date;      // Vote timestamp
}

// ============================================================================
// FORM DATA TYPES
// ============================================================================

/**
 * Form data interface for poll creation
 * 
 * Used by the poll creation form to collect and validate
 * user input before submitting to the server.
 */
export interface CreatePollFormData {
  title: string;                    // Poll question (required, max 500 chars)
  description?: string;             // Optional poll description
  options: string[];                // Array of option texts (2-10 required)
  settings: PollSettings;           // Poll configuration settings
  endDate?: string;                 // Optional end date as ISO string
}

/**
 * Form data interface for user authentication login
 * 
 * Used by the login form to collect user credentials
 * for authentication with Supabase Auth.
 */
export interface LoginFormData {
  email: string;        // User's email address
  password: string;     // User's password (minimum 8 characters)
}

/**
 * Form data interface for user registration
 * 
 * Used by the registration form to collect new user information
 * for account creation with Supabase Auth.
 */
export interface RegisterFormData {
  name: string;         // User's display name
  email: string;        // User's email address (must be unique)
  password: string;     // User's password (minimum 8 characters)
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Standard API response type for server actions
 * 
 * Provides consistent error handling across all server actions
 * in the application.
 */
export interface ApiResponse<T = any> {
  data?: T;             // Response data (present on success)
  error?: string;       // Error message (present on failure)
  success: boolean;     // Indicates if operation was successful
}

/**
 * Poll results interface for displaying voting results
 * 
 * Contains aggregated voting data with percentages and
 * vote counts for comprehensive results display.
 */
export interface PollResults {
  poll: Poll;           // Complete poll information
  options: Array<{      // Results for each option
    text: string;       // Option text
    votes: number;      // Vote count
    percentage: number; // Percentage of total votes (0-100)
  }>;
  totalVotes: number;   // Total number of votes cast
  userHasVoted: boolean; // Whether current user has voted
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

/**
 * Props interface for poll card components
 * 
 * Used by poll list components to display poll previews
 * with consistent data structure.
 */
export interface PollCardProps {
  poll: {
    id: string;
    title: string;
    description?: string;
    options: any[];
    votes?: number;
    createdAt: string | Date;
  };
  showActions?: boolean;  // Whether to show edit/delete actions
}

/**
 * Props interface for voting components
 * 
 * Used by voting interface components to handle
 * vote submission and result display.
 */
export interface VotingProps {
  pollId: string;
  options: PollOption[];
  hasVoted: boolean;
  onVoteSubmit: (optionIndex: number) => Promise<void>;
}