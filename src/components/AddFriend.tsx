'use client';

import { useActionState } from 'react';
import { sendFriendRequest } from '@/actions/friends';

type State = { error?: string; success?: boolean } | null;

export default function AddFriend() {
  const [state, formAction, isPending] = useActionState<State, FormData>(sendFriendRequest, null);

  return (
    <div className="glass-card p-6 rounded-xl space-y-4">
      <h3 className="font-bold text-lg">Add Friend</h3>
      <form action={formAction} className="flex flex-col gap-2">
        <input 
          name="email" 
          type="text" 
          placeholder="Email or username" 
          required
          className="input-field w-full"
        />
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-primary text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 w-full"
        >
          {isPending ? 'Sending...' : 'Send Request'}
        </button>
      </form>
      {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state?.success && <p className="text-green-500 text-sm">Request sent!</p>}
    </div>
  );
}
