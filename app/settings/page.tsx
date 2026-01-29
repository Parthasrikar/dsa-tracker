import { getSession } from '@/lib/auth';
import { User } from '@/models/User';
import dbConnect from '@/lib/db';
import { redirect } from 'next/navigation';
import SettingsForm from '@/components/SettingsForm';

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

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <div className="glass-card p-6 rounded-2xl space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Program Configuration</h2>
          <p className="text-muted-foreground text-sm">Adjust your timeline settings.</p>
        </div>

        <SettingsForm startDateStr={startDateStr} totalWeeks={config.totalWeeks} />
      </div>
    </div>
  );
}
