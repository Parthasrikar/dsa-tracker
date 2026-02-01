'use client';

import { useState } from 'react';
import { UserPlus, Check, Clock } from 'lucide-react';
import { sendFriendRequestById } from '@/actions/friends';
import { clsx } from 'clsx';
import { useToast } from '@/components/ToastProvider';

export default function AddFriendButton({ userId, isFriend, hasPendingRequest }: { userId: string, isFriend: boolean, hasPendingRequest?: boolean }) {
    const [status, setStatus] = useState<'IDLE' | 'SENT'>('IDLE');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();

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
            const res = await sendFriendRequestById(userId);
            if (res.success) {
                setStatus('SENT');
                showToast('Friend request sent successfully!', 'success');
            } else if (res.error) {
                console.error('Friend request error:', res.error);
                showToast(res.error || 'Failed to send friend request. Please try again.', 'error');
            }
        } catch (err) {
            console.error('Unexpected error:', err);
            showToast('An unexpected error occurred. Please try again later.', 'error');
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
