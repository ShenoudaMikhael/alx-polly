import { getPollById } from '@/app/lib/actions/poll-actions';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
// Import the client component
import EditPollForm from './EditPollForm';

export default async function EditPollPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { poll, error } = await getPollById(id);

  if (error || !poll) {
    notFound();
  }

  // Check if user owns the poll
  if (poll.user_id !== user.id) {
    redirect('/polls'); // Redirect to polls page if not owner
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Poll</h1>
      <EditPollForm poll={poll} />
    </div>
  );
}