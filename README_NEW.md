# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## 📋 Project Overview

ALX Polly is a comprehensive polling platform that demonstrates modern web development patterns and security considerations. The application provides a complete user experience from authentication to poll management and voting.

### Key Features

- **🔐 Authentication System**: Secure user registration and login with Supabase Auth
- **📊 Poll Management**: Create, edit, delete, and share polls with validation
- **🗳️ Voting System**: Interactive voting with real-time results and duplicate prevention
- **👥 User Dashboard**: Personalized space for managing user's polls
- **⚡ Admin Panel**: Administrative interface for system-wide poll management
- **📱 Responsive Design**: Mobile-first design with Tailwind CSS
- **🔒 Security Features**: Input validation, sanitization, and authorization controls

## 🛠️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful UI components
- **[Lucide React](https://lucide.dev/)** - Icon library

### Backend & Database
- **[Supabase](https://supabase.io/)** - Backend as a Service (BaaS)
  - PostgreSQL database
  - Authentication service
  - Real-time subscriptions
  - Row Level Security (RLS)

### Development Tools
- **[React Hook Form](https://react-hook-form.com/)** - Form handling
- **[Zod](https://zod.dev/)** - Schema validation
- **[ESLint](https://eslint.org/)** - Code linting
- **TypeScript** - Static type checking

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v20.x or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** - Package manager
- **Git** - Version control

### 1. Clone the Repository

```bash
git clone https://github.com/ShenoudaMikhael/alx-polly.git
cd alx-polly
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Supabase Configuration

#### Option A: Use Existing Supabase Project

The project includes a pre-configured Supabase setup. You'll need to:

1. Create a free account at [supabase.io](https://supabase.io)
2. Create a new project
3. Set up your environment variables (see step 4)

#### Option B: Set Up New Supabase Project

1. **Create Supabase Project**:
   - Go to [supabase.io](https://supabase.io) and create a new project
   - Note your project URL and anon key

2. **Database Setup**:
   Run the following SQL in your Supabase SQL editor:

```sql
-- Create polls table
CREATE TABLE polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls
CREATE POLICY "Users can view all polls" ON polls FOR SELECT USING (true);
CREATE POLICY "Users can create polls" ON polls FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own polls" ON polls FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own polls" ON polls FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for votes
CREATE POLICY "Users can view all votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Users can create votes" ON votes FOR INSERT WITH CHECK (true);
```

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To get these values:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" and "anon public" key

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 💻 Usage Examples

### Creating a Poll

1. **Sign up/Login** to your account
2. **Navigate** to "Create Poll" from the dashboard
3. **Enter** your poll question (max 500 characters)
4. **Add options** (minimum 2, maximum 10, max 200 characters each)
5. **Click** "Create Poll" to publish

```typescript
// Example poll creation
const pollData = {
  question: "What's your favorite programming language?",
  options: ["JavaScript", "Python", "TypeScript", "Go", "Rust"]
};
```

### Voting on Polls

1. **Browse** available polls on the polls page
2. **Click** on a poll to view details
3. **Select** your preferred option
4. **Submit** your vote
5. **View** real-time results with percentages

### Managing Your Polls

1. **Access** your dashboard to see all your polls
2. **Edit** poll questions and options (if no votes yet)
3. **Delete** polls you no longer need
4. **Share** poll links with others

### Admin Features

Admin users can:
- **View** all polls in the system
- **Delete** any poll for moderation
- **Access** user and poll metadata

To become an admin, use an email containing "admin" or contact the system administrator.

## 🏗️ Project Structure

```
alx-polly/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── admin/           # Admin panel
│   │   ├── create/          # Poll creation
│   │   └── polls/           # Poll management
│   ├── components/          # Reusable components
│   ├── lib/
│   │   ├── actions/         # Server actions
│   │   ├── context/         # React contexts
│   │   └── types/           # TypeScript definitions
│   └── globals.css
├── components/ui/           # shadcn/ui components
├── lib/
│   ├── supabase/           # Supabase client configuration
│   └── utils.ts            # Utility functions
├── public/                 # Static assets
└── package.json
```

## 🧪 Testing the Application

### Manual Testing

1. **Authentication Flow**:
   ```bash
   # Test user registration
   # Test user login
   # Test logout functionality
   ```

2. **Poll Management**:
   ```bash
   # Create polls with various options
   # Edit existing polls
   # Delete polls
   # Test validation errors
   ```

3. **Voting System**:
   ```bash
   # Vote on polls as different users
   # Verify duplicate vote prevention
   # Check real-time result updates
   ```

### Running in Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🔒 Security Features

### Implemented Security Measures

1. **Authentication & Authorization**:
   - Secure user authentication with Supabase
   - Row Level Security (RLS) policies
   - JWT token validation
   - Session management

2. **Input Validation & Sanitization**:
   - Server-side input validation
   - HTML tag removal to prevent XSS
   - Character length limits
   - SQL injection prevention via parameterized queries

3. **Access Control**:
   - User ownership verification
   - Admin privilege checking
   - Protected routes with authentication
   - Conditional UI rendering based on permissions

4. **Data Protection**:
   - Sensitive data filtering in logs
   - Secure environment variable handling
   - Database-level constraints and validation

## 🐛 Known Limitations

- **Anonymous Voting**: Currently supported but user tracking is limited
- **Real-time Updates**: Results don't update automatically without page refresh
- **File Uploads**: Not currently supported for poll attachments
- **Email Verification**: May require additional Supabase configuration

## 🚀 The Challenge: Security Audit & Remediation

**🔍 Security Engineer Challenge**

This application has been intentionally built with security considerations in mind, but there may still be vulnerabilities to discover and address. Your mission as a security engineer is to:

### Your Objectives:

1. **🔍 Identify Potential Vulnerabilities**:
   - Review authentication flows for weaknesses
   - Analyze input validation and sanitization
   - Check authorization and access controls
   - Examine data exposure risks

2. **🎯 Understand Impact**:
   - Assess potential data exposure
   - Evaluate unauthorized access risks
   - Consider privilege escalation scenarios

3. **🛠️ Implement Fixes**:
   - Strengthen authentication mechanisms
   - Improve input validation
   - Enhance authorization checks
   - Add additional security layers

### Where to Start?

1. **📚 Code Review**:
   - Examine `app/lib/actions/` for server-side logic
   - Review authentication context in `app/lib/context/`
   - Analyze database queries and RLS policies
   - Check admin panel access controls

2. **🤖 Use AI Assistance**:
   - Ask your AI assistant to review code snippets
   - Describe features and ask about attack vectors
   - Request security best practices for specific scenarios

3. **🧪 Dynamic Testing**:
   - Test different user roles and permissions
   - Attempt unauthorized actions
   - Verify input validation boundaries
   - Check for information disclosure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/ShenoudaMikhael/alx-polly/issues) page
2. Create a new issue with detailed information
3. Reach out to the development team

---

**Happy coding and security hunting! 🚀🔒**
