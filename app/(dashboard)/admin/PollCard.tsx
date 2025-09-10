"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Poll {
  id: string;
  question: string;
  user_id: string;
  created_at: string;
  options: string[];
}

interface PollCardProps {
  poll: Poll;
  handleDelete: (pollId: string) => void;
  deleteLoading: string | null;
}

export default function PollCard({ poll, handleDelete, deleteLoading }: PollCardProps) {
  return (
    <Card key={poll.id} className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{poll.question}</CardTitle>
            <CardDescription>
              <div className="space-y-1 mt-2">
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
  );
}