import dbConnect from '@/lib/db';
import { Problem } from '@/models/Problem';
import { Day, IDay } from '@/models/Day';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { subDays } from 'date-fns';
import GlobalAnalysisView from '@/components/GlobalAnalysisView';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const { userId } = await params;
  await dbConnect();
  
  const user = await User.findById(userId).lean();
  if (!user) {
    notFound();
  }

  // Fetch ALL problems for the user
  const allProblems = await Problem.find({ userId: userId }).lean();
  
  // Fetch consistency data (last ~6 months)
  const sixMonthsAgo = subDays(new Date(), 180);
  const historicalDays = await Day.find({ 
      date: { $gte: sixMonthsAgo },
      userId: userId
  })
  .select('date isCompleted')
  .sort({ date: 1 })
  .lean<IDay[]>();

  const consistencyData = historicalDays.map((d: IDay) => ({
      date: d.date.toISOString(),
      isCompleted: !!d.isCompleted
  }));

  // Serialize problems
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedProblems = allProblems.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
      userId: p.userId.toString(),
      dayId: p.dayId?.toString(),
      createdAt: p.createdAt ? p.createdAt.toISOString() : undefined,
      updatedAt: p.updatedAt ? p.updatedAt.toISOString() : undefined,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userName = (user as any).name;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const joinedAt = (user as any).createdAt ? new Date((user as any).createdAt).toLocaleDateString() : 'Unknown';

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 p-6 glass-card rounded-2xl flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-3xl font-bold text-white">
          {userName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{userName}</h1>
          <p className="text-muted-foreground">Member since {joinedAt}</p>
        </div>
      </div>

      <GlobalAnalysisView 
        problems={serializedProblems} 
        consistencyData={consistencyData}
        showCopyButton={true}
      />
    </div>
  );
}
