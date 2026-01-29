import dbConnect from '@/lib/db';
import { Week } from '@/models/Week';
import { Day, IDay } from '@/models/Day';
import { Problem } from '@/models/Problem';
import { notFound } from 'next/navigation';
import WeekView from '@/components/WeekView';
import { subDays } from 'date-fns';

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function WeekPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const resolvedParams = await params;
  const weekNum = parseInt(resolvedParams.id);

  if (isNaN(weekNum)) {
    notFound();
  }

  await dbConnect();
  
  const week = await Week.findOne({ weekNumber: weekNum, userId: session.user.id }).lean();
  
  if (!week) {
    notFound();
  }
  
  // Transform _id to string manually since simple-json serialization might complain about ObjectIds
  // Actually, Server Components to Client Components props must be plain JSON.
  // Mongoose lean() returns POJOs but mostly with ObjectIds.
  // We'll map them.

  const days = await Day.find({ weekNumber: weekNum, userId: session.user.id }).sort({ date: 1 }).lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const problems = await Problem.find({ weekNumber: weekNum, userId: session.user.id }).lean() as any[];

  // Group problems by dayId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const problemsByDay: Record<string, any[]> = {};
  problems.forEach(p => {
      const dId = p.dayId ? p.dayId.toString() : 'unassigned';
      if(!problemsByDay[dId]) problemsByDay[dId] = [];
      problemsByDay[dId].push({
          ...p,
          _id: p._id.toString(),
          userId: p.userId.toString(),
          dayId: p.dayId ? p.dayId.toString() : undefined,
          createdAt: p.createdAt ? p.createdAt.toISOString() : undefined,
          updatedAt: p.updatedAt ? p.updatedAt.toISOString() : undefined
      });
  });

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

  const serializedWeek = {
    ...week,
    _id: week._id.toString(),
    userId: week.userId.toString(),
    startDate: week.startDate.toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: (week as any).createdAt ? (week as any).createdAt.toISOString() : undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedAt: (week as any).updatedAt ? (week as any).updatedAt.toISOString() : undefined,
  };

  const serializedDays = days.map(d => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const day = d as any; // Cast to any to bypass Mongoose type strictness on lean() results for now
      const dayIdStr = day._id.toString();
      return {
        ...day,
        _id: dayIdStr,
        userId: day.userId.toString(),
        date: day.date.toISOString(),
        createdAt: day.createdAt ? day.createdAt.toISOString() : undefined,
        updatedAt: day.updatedAt ? day.updatedAt.toISOString() : undefined,
        problems: problemsByDay[dayIdStr] || []
      };
  });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Week {weekNum} Planning</h1>
        <p className="text-muted-foreground">Manage your daily tasks and reflection.</p>
      </div>

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <WeekView week={serializedWeek as any} days={serializedDays as any[]} consistencyData={consistencyData} />
    </div>
  );
}
