import dbConnect from '@/lib/db';
import { Day, IDay } from '@/models/Day';
import { Problem } from '@/models/Problem';
import { subDays } from 'date-fns';
import GlobalAnalysisView from '@/components/GlobalAnalysisView';

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  await dbConnect();
  
  // Fetch ALL problems across all weeks for the user
  const allProblems = await Problem.find({ userId: session.user.id }).lean();
  
  // Fetch consistency data (last ~6 months)
  const sixMonthsAgo = subDays(new Date(), 180);
  const historicalDays = await Day.find({ 
      date: { $gte: sixMonthsAgo },
      userId: session.user.id
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

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Global Insights</h1>
        <p className="text-muted-foreground">Your complete journey analytics across all weeks.</p>
      </div>

      <GlobalAnalysisView 
        problems={serializedProblems} 
        consistencyData={consistencyData} 
      />
    </div>
  );
}
