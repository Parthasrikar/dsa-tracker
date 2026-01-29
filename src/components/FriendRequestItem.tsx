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
    <div className="glass-card p-5 rounded-xl hover:bg-white/5 transition-all duration-300 border border-white/5 hover:border-primary/20">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
            <User size={12} className="text-white" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-base truncate">{userName}</h4>
          <p className="text-xs text-muted-foreground">wants to connect with you</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => handleAction('ACCEPT')}
            className="group relative px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded-lg font-bold text-sm transition-all duration-200 border border-green-500/30 hover:border-green-500/50 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <Check size={16} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Accept</span>
          </button>
          <button 
            onClick={() => handleAction('REJECT')}
            className="group relative px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg font-bold text-sm transition-all duration-200 border border-red-500/30 hover:border-red-500/50 hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <X size={16} className="group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Decline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
