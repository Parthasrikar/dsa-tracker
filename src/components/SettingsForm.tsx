'use client';

import { useToast } from '@/components/ToastProvider';
import { useState, useTransition } from 'react';
import { updateProgramConfig } from '@/actions';
import { useRouter } from 'next/navigation';

interface SettingsFormProps {
  startDateStr: string;
  totalWeeks: number;
}

export default function SettingsForm({ startDateStr, totalWeeks }: SettingsFormProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState(startDateStr);
  const [weeks, setWeeks] = useState(totalWeeks);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    startTransition(async () => {
      try {
        await updateProgramConfig(startDate, weeks);
        showToast('Settings updated successfully!', 'success');
        router.refresh();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
        showToast(errorMessage, 'error');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Start Date</label>
        <input 
          type="date" 
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="input-field w-full" 
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground mt-1">First day of Week 1</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Total Duration (Weeks)</label>
        <input 
          type="number" 
          value={weeks}
          onChange={(e) => setWeeks(parseInt(e.target.value))}
          min={1} 
          max={52}
          className="input-field w-full" 
          disabled={isPending}
        />
      </div>

      <div className="pt-4">
        <button 
          type="submit"
          disabled={isPending}
          className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
