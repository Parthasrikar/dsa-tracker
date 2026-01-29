'use client';

import { useMemo } from 'react';
import { eachDayOfInterval, subDays, format, isSameDay, startOfWeek } from 'date-fns';
import { clsx } from 'clsx';

interface HeatmapProps {
  data: { date: string; isCompleted: boolean }[];
}

export default function Heatmap({ data }: HeatmapProps) {
  // Generate last 365 days (or closer to 6 months for mobile fitting)
  // Let's do roughly 6 months ~ 26 weeks
  const today = useMemo(() => new Date(), []);
  const weeksToShow = 26; // approx 6 months
  const totalDays = weeksToShow * 7;
  const startDate = startOfWeek(subDays(today, totalDays - 1)); // Ensure we start at beginning of a week
  
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: startDate,
      end: today
    });
  }, [startDate, today]);

  return (
    <div className="glass-card p-6 rounded-2xl w-full overflow-x-auto">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
        Consistency Heatmap
      </h3>
      
      <div className="flex gap-1 min-w-max">
        {/* Render columns (weeks) */}
        {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIndex) => {
            const weekDays = calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7);
            return (
                <div key={weekIndex} className="flex flex-col gap-1">
                    {weekDays.map(day => {
                        const dayData = data.find(d => isSameDay(new Date(d.date), day));
                        // Colors: Done = bright green, Not done but past = dark grey, Future = invisible (not pertinent here as we stop at today)
                        const isCompleted = dayData?.isCompleted;
                        
                        return (
                            <div 
                                key={day.toISOString()} 
                                title={`${format(day, 'MMM do')}: ${isCompleted ? 'Completed' : 'Missed'}`}
                                className={clsx(
                                    "w-3 h-3 rounded-sm transition-all duration-300",
                                    isCompleted 
                                        ? "bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.5)]" 
                                        : "bg-white/5 hover:bg-white/10"
                                )}
                            />
                        );
                    })}
                </div>
            )
        })}
      </div>
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-white/5"></div>
              <span>Missed</span>
          </div>
          <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500"></div>
              <span>Goal Reached</span>
          </div>
      </div>
    </div>
  );
}
