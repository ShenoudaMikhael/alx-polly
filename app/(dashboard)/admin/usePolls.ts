import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { deletePoll } from "@/app/lib/actions/poll-actions";

interface Poll {
    id: string;
    question: string;
    user_id: string;
    created_at: string;
    options: string[];
}

export function usePolls() {
    const [polls, setPolls] = useState<Poll[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchAllPolls();
    }, []);

    const fetchAllPolls = async () => {
        const supabase = createClient();
        const { data, error } = await supabase
            .from("polls")
            .select("*")
            .order("created_at", { ascending: false });

        if (!error && data) {
            setPolls(data);
        }
        setLoading(false);
    };

    const handleDelete = async (pollId: string) => {
        setDeleteLoading(pollId);
        const result = await deletePoll(pollId);
        if (!result.error) {
            setPolls(polls.filter((poll) => poll.id !== pollId));
        }
        setDeleteLoading(null);
    };

    return { polls, loading, deleteLoading, handleDelete };
}
