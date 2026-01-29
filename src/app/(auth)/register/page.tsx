'use client';

import { useActionState } from 'react';
import { signup } from '@/actions/auth';
import Link from 'next/link';

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(signup, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="glass-card w-full max-w-md p-8 rounded-2xl relative z-10">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Create Account
        </h1>
        <p className="text-muted-foreground mb-8">Join to track your DSA journey</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
            <input
              name="name"
              type="text"
              placeholder="John Doe"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              className="input-field w-full"
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground mt-1">Must be at least 6 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Start Date</label>
            <input
              name="startDate"
              type="date"
              className="input-field w-full"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">When do you want to start tracking?</p>
          </div>

          {state?.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-primary hover:bg-primary/80 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isPending ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
