'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getPollResults, submitVote, hasUserVoted } from '@/app/lib/actions/poll-actions';
import { useAuth } from '@/app/lib/context/auth-context';
import { notFound } from 'next/navigation';

interface PollOption {
  text: string;
  votes: number;
  percentage: number;
}

interface PollResults {
  poll: {
    id: string;
    question: string;
    user_id: string;
    created_at: string;
    options: string[];
    isOwner?: boolean;
  };
  options: PollOption[];
  totalVotes: number;
}

export default function PollDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollId, setPollId] = useState<string>('');

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params;
      setPollId(resolvedParams.id);
    };
    loadParams();
  }, [params]);

  useEffect(() => {
    if (pollId) {
      loadPollData();
      checkUserVoted();
    }
  }, [pollId, user]);

  const loadPollData = async () => {
    if (!pollId) return;
    
    try {
      const { results, error } = await getPollResults(pollId);
      if (error) {
        setError(error);
        return;
      }
      if (!results) {
        notFound();
        return;
      }
      setPollResults(results);
    } catch (err) {
      setError('Failed to load poll data');
    } finally {
      setLoading(false);
    }
  };

  const checkUserVoted = async () => {
    if (!user || !pollId) return;
    
    try {
      const { hasVoted: userHasVoted } = await hasUserVoted(pollId);
      setHasVoted(userHasVoted);
    } catch (err) {
      console.error('Error checking vote status:', err);
    }
  };

  const handleVote = async () => {
    if (selectedOption === null || !pollResults || !pollId) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await submitVote(pollId, selectedOption);
      if (result.error) {
        setError(result.error);
      } else {
        setHasVoted(true);
        // Reload poll data to show updated results
        await loadPollData();
      }
    } catch (err) {
      setError('Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="max-w-3xl mx-auto py-8">Loading poll...</div>;
  }

  if (error && !pollResults) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="text-gray-600 mt-2">{error}</p>
          <Link href="/polls" className="text-blue-600 hover:underline mt-4 inline-block">
            ← Back to Polls
          </Link>
        </div>
      </div>
    );
  }

  if (!pollResults) {
    notFound();
    return null;
  }

  const { poll, options, totalVotes } = pollResults;
  const isOwner = user && poll.user_id === user.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/polls" className="text-blue-600 hover:underline">
          &larr; Back to Polls
        </Link>
        {isOwner && (
          <div className="flex space-x-2">
            <Button variant="outline" asChild>
              <Link href={`/polls/${pollId}/edit`}>Edit Poll</Link>
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{poll.question}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          {!hasVoted && !loading ? (
            <div className="space-y-3">
              {poll.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${selectedOption === index ? 'border-blue-500 bg-blue-50' : 'hover:bg-slate-50'}`}
                  onClick={() => setSelectedOption(index)}
                >
                  {option}
                </div>
              ))}
              <Button 
                onClick={handleVote} 
                disabled={selectedOption === null || isSubmitting} 
                className="mt-4"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-medium">Results:</h3>
              {options.map((option, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{option.text}</span>
                    <span>{option.percentage}% ({option.votes} votes)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${option.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              <div className="text-sm text-slate-500 pt-2">
                Total votes: {totalVotes}
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="text-sm text-slate-500 flex justify-between">
          <span>Created on {new Date(poll.created_at).toLocaleDateString()}</span>
        </CardFooter>
      </Card>
    </div>
  );
}