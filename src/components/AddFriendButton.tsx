'use client';

import { useState } from 'react';
import { UserPlus, Check, Clock } from 'lucide-react';
import { sendFriendRequest } from '@/actions/friends';
import { clsx } from 'clsx';

export default function AddFriendButton({ userId, isFriend, hasPendingRequest }: { userId: string, isFriend: boolean, hasPendingRequest?: boolean }) {
    const [status, setStatus] = useState<'IDLE' | 'SENT'>('IDLE');
    const [loading, setLoading] = useState(false);

    if (isFriend) {
        return (
            <span className="flex items-center gap-1 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold border border-green-500/20">
                <Check size={12} />
                Friend
            </span>
        );
    }

    if (hasPendingRequest || status === 'SENT') {
        return (
            <span className="flex items-center gap-1 px-3 py-1 bg-yellow-500/10 text-yellow-500 rounded-full text-xs font-bold border border-yellow-500/20 whitespace-nowrap">
                <Clock size={12} />
                Request Sent
            </span>
        );
    }

    const handleSend = async () => {
        setLoading(true);
        try {
            const res = await sendFriendRequest(userId);
            if (res.success) {
                setStatus('SENT');
            } else {
                console.error(res.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleSend}
            disabled={loading}
            className={clsx(
                "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-xs font-bold",
                "bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-95",
                loading && "opacity-50 cursor-not-allowed"
            )}
            title="Add Friend"
        >
            <UserPlus size={14} />
            <span>Add Friend</span>
        </button>
    );
}
