import dbConnect from '@/lib/db';
import { Week } from '@/models/Week';
import { Day, IDay } from '@/models/Day';
import { Problem } from '@/models/Problem';
import { notFound } from 'next/navigation';
import WeekView from '@/components/WeekView';
import { subDays } from 'date-fns';

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getOrSetCache, generateCacheKey } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

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

  // Optimize: Fetch consistency data for last 90 days instead of 180 (faster query)
  const ninetyDaysAgo = subDays(new Date(), 90);

  // Fetch with Redis Cache
  const [week, days, problems, historicalDays] = await getOrSetCache(
    generateCacheKey('week', weekNum, session.user.id),
    async () => {
      await dbConnect();
      return await Promise.all([
        Week.findOne({ weekNumber: weekNum, userId: session.user.id })
          .select('weekNumber startDate goals satisfaction reflection userId')
          .lean(),
        Day.find({ weekNumber: weekNum, userId: session.user.id })
          .select('_id dayName date isCompleted notes plan weekNumber userId')
          .sort({ date: 1 })
          .lean(),
        Problem.find({ weekNumber: weekNum, userId: session.user.id })
          .select('_id title link status difficulty starred tags rating dayId userId weekNumber createdAt')
          .lean(),
        Day.find({
          date: { $gte: ninetyDaysAgo },
          userId: session.user.id
        })
          .select('date isCompleted')
          .sort({ date: 1 })
          .lean<IDay[]>()
      ]);
    },
    60 // Cache for 60 seconds
  );

  if (!week) {
    notFound();
  }

  // Helper to ensure date string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toISO = (d: any) => d ? new Date(d).toISOString() : undefined;

  // Group problems by dayId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const problemsByDay: Record<string, any[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (problems as any[]).forEach(p => {
    const dId = p.dayId ? p.dayId.toString() : 'unassigned';
    if (!problemsByDay[dId]) problemsByDay[dId] = [];
    problemsByDay[dId].push({
      ...p,
      _id: p._id.toString(),
      userId: p.userId.toString(),
      dayId: p.dayId ? p.dayId.toString() : undefined,
      createdAt: toISO(p.createdAt),
      updatedAt: toISO(p.updatedAt)
    });
  });

  const consistencyData = historicalDays.map((d: IDay) => ({
    date: new Date(d.date).toISOString(), // Handle both Date obj and string
    isCompleted: !!d.isCompleted
  }));

  const serializedWeek = {
    ...week,
    _id: week._id.toString(),
    userId: week.userId.toString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    startDate: new Date((week as any).startDate).toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createdAt: toISO((week as any).createdAt),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedAt: toISO((week as any).updatedAt),
  };

  const serializedDays = days.map(d => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const day = d as any; // Cast to any to bypass Mongoose type strictness on lean() results for now
    const dayIdStr = day._id.toString();
    return {
      ...day,
      _id: dayIdStr,
      userId: day.userId.toString(),
      date: new Date(day.date).toISOString(),
      createdAt: day.createdAt ? new Date(day.createdAt).toISOString() : undefined,
      updatedAt: day.updatedAt ? new Date(day.updatedAt).toISOString() : undefined,
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
