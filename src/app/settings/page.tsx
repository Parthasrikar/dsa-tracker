import { getSession } from '@/lib/auth';
import { User } from '@/models/User';
import dbConnect from '@/lib/db';
import { redirect } from 'next/navigation';
import { updateProgramConfig } from '@/actions';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  await dbConnect();
  const user = await User.findById(session.user.id).lean();

  if (!user) {
    redirect('/login');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = (user as any).programConfig || {
    startDate: new Date(),
    totalWeeks: 12
  };
  
  const startDateStr = config.startDate ? new Date(config.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  async function saveConfig(formData: FormData) {
    'use server';
    const start = formData.get('startDate') as string;
    const weeks = parseInt(formData.get('totalWeeks') as string);
    await updateProgramConfig(start, weeks);
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="glass-card p-6 rounded-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Program Configuration</h2>
          <p className="text-muted-foreground text-sm">Adjust your timeline settings.</p>
        </div>

        <form action={saveConfig} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input 
              type="date" 
              name="startDate"
              defaultValue={startDateStr}
              className="input-field w-full" 
            />
            <p className="text-xs text-muted-foreground mt-1">First day of Week 1</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Total Duration (Weeks)</label>
            <input 
              type="number" 
              name="totalWeeks"
              defaultValue={config.totalWeeks}
              min={1} 
              max={52}
              className="input-field w-full" 
            />
          </div>

          <div className="pt-4">
            <button className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-lg font-bold transition-all">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
