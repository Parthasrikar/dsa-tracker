import dbConnect from '@/lib/db';
import { Week } from '@/models/Week';
import { Day } from '@/models/Day';
import { Problem } from '@/models/Problem';
import { User } from '@/models/User';
import { format, isSameWeek, addDays } from 'date-fns';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

// Force dynamic rendering to ensure dates are fresh
export const dynamic = 'force-dynamic';

import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

async function getData(userId: string) {
  await dbConnect();
  
  // Fetch user config
  const user = await User.findById(userId).lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalWeeks = (user as any)?.programConfig?.totalWeeks || 12;
  
  // Fetch all weeks, days, and problems for the user
  const weeksData = await Week.find({ userId }).sort({ weekNumber: 1 }).lean();
  const daysData = await Day.find({ userId }).lean();
  const problemsData = await Problem.find({ userId }).lean();

  return { weeks: weeksData, days: daysData, problems: problemsData, totalWeeks };
}


export default async function Dashboard() {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const { weeks, days, problems, totalWeeks } = await getData(session.user.id);
  const today = new Date();

  // Helper to group days and calc progress
  const getWeekStats = (weekNum: number) => {
    const weekDays = days.filter(d => d.weekNumber === weekNum).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const completed = weekDays.filter(d => d.isCompleted).length;
    const total = 7;
    const percent = Math.round((completed / total) * 100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weekProblems = problems.filter((p: any) => p.weekNumber === weekNum);
    return { weekDays, completed, percent, problemCount: weekProblems.length };
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-400 pb-2">
          {totalWeeks} Weeks to Glory
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Consistency is the key. Track your DSA journey, day by day, week by week.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {weeks.map((week) => {
          const { percent, completed, weekDays, problemCount } = getWeekStats(week.weekNumber);
          const isCurrent = isSameWeek(new Date(week.startDate), today, { weekStartsOn: 1 });
          const endDate = addDays(new Date(week.startDate), 6);

          return (
            <Link 
              href={`/week/${week.weekNumber}`} 
              key={week._id.toString()}
              className={clsx(
                "group relative p-6 rounded-2xl border transition-all duration-300",
                isCurrent 
                  ? "bg-primary/10 border-primary shadow-[0_0_30px_-10px_rgba(124,58,237,0.5)] scale-105 ring-1 ring-primary" 
                  : "glass-card hover:translate-y-[-4px]"
              )}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-lg">
                  CURRENT WEEK
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <h3 className={clsx("text-2xl font-bold font-mono", isCurrent ? "text-primary" : "text-foreground")}>
                    Week {week.weekNumber}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(week.startDate), 'MMM d')} - {format(endDate, 'MMM d')}
                  </p>
                </div>
                {percent === 100 ? (
                  <CheckCircle2 className="text-green-500" />
                ) : (
                   <div className="text-xs font-mono font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded">
                     {percent}%
                   </div>
                )}
              </div>

              {/* Mini 7-Day Heatmap */}
              <div className="mb-3">
                <div className="flex gap-1 justify-between">
                  {weekDays.map((day, idx) => (
                    <div 
                      key={idx}
                      className={clsx(
                        "flex-1 h-8 rounded transition-all",
                        day.isCompleted 
                          ? "bg-green-500/80 hover:bg-green-500" 
                          : "bg-white/5 hover:bg-white/10"
                      )}
                      title={`${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][idx]} - ${day.isCompleted ? 'Completed' : 'Incomplete'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">
                    <span className="font-bold text-foreground">{completed}</span>/7 Days
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-bold text-green-500">{problemCount}</span> Problems
                  </span>
                </div>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-bold">
                  View →
                </span>
              </div>

            </Link>
          );
        })}
      </div>
    </div>
  );
}
