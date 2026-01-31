'use client';

import { respondToFriendRequest } from '@/actions/friends';
import { useTransition } from 'react';
import { Check, X, User } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FriendRequestItem({ request }: { request: any }) {
  const [isPending, startTransition] = useTransition();
  const userName = request.from.name;

  const handleAction = (action: 'ACCEPT' | 'REJECT') => {
    startTransition(async () => {
      await respondToFriendRequest(request._id, action);
    });
  };

  if (isPending) {
    return (
      <div className="glass-card p-4 rounded-xl animate-pulse">
        <div className="text-sm text-muted-foreground">Processing...</div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 rounded-xl transition-all duration-300 border border-white/5 hover:border-primary/20">
      <div className="flex flex-col gap-3">
        {/* Top Row: Info */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
              <User size={10} className="text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm truncate">{userName}</h4>
            <p className="text-xs text-muted-foreground leading-tight">wants to connect</p>
          </div>
        </div>

        {/* Bottom Row: Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => handleAction('ACCEPT')}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg font-bold text-xs transition-colors border border-green-500/20"
          >
            <Check size={14} />
            Accept
          </button>
          <button
            onClick={() => handleAction('REJECT')}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold text-xs transition-colors border border-red-500/20"
          >
            <X size={14} />
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
