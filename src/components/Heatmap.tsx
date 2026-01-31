'use client';

import { useMemo } from 'react';
import {
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  format,
  isSameDay,
  isAfter,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  addWeeks,
  getMonth,
  getDate
} from 'date-fns';
import { clsx } from 'clsx';

interface HeatmapProps {
  data: { date: string; isCompleted: boolean }[];
}

export default function Heatmap({ data }: HeatmapProps) {
  const today = new Date();
  const yearStart = startOfYear(today);
  const yearEnd = endOfYear(today);

  // Get all weeks required to cover the year
  const weeks = useMemo(() => {
    const interval = { start: yearStart, end: yearEnd };
    return eachWeekOfInterval(interval, { weekStartsOn: 1 }); // Monday start
  }, [yearStart, yearEnd]);


  return (
    <div className="glass-card p-6 rounded-2xl w-full overflow-x-auto">
      <h3 className="text-lg font-bold mb-8 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
        {format(today, 'yyyy')} Consistency
      </h3>

      <div className="min-w-max">
        <div className="flex gap-1">
          {/* Days of Week Labels (optional, maybe just M/W/F) */}
          <div className="flex flex-col gap-1 pr-2 text-[10px] text-muted-foreground pt-[1px] invisible md:visible">
            <div className="h-3"></div> {/* spacer */}
            <div className="h-3 leading-3">Mon</div>
            <div className="h-3"></div>
            <div className="h-3 leading-3">Wed</div>
            <div className="h-3"></div>
            <div className="h-3 leading-3">Fri</div>
            <div className="h-3"></div>
          </div>

          {/* The Grid */}
          <div className="flex gap-1">
            {weeks.map((weekStart, weekIndex) => {
              const prevWeekStart = weeks[weekIndex - 1];
              const isNewMonth = weekIndex > 0 && getMonth(weekStart) !== getMonth(prevWeekStart);
              const showLabel = weekIndex === 0 || isNewMonth;

              // Generate 7 days for this week
              const days = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + i);
                return d;
              });

              return (
                <div
                  key={weekIndex}
                  className={clsx(
                    "flex flex-col gap-1 relative",
                    isNewMonth && "ml-3" // Add gap between months
                  )}
                >
                  {/* Month Label */}
                  {showLabel && (
                    <span className="absolute -top-5 text-xs text-muted-foreground whitespace-nowrap">
                      {format(weekStart, 'MMM')}
                    </span>
                  )}

                  {days.map(day => {
                    const dayData = data.find(d => isSameDay(new Date(d.date), day));
                    const isCompleted = dayData?.isCompleted;
                    const inYear = day.getFullYear() === today.getFullYear();

                    if (!inYear) {
                      return <div key={day.toISOString()} className="w-3 h-3" />;
                    }

                    return (
                      <div
                        key={day.toISOString()}
                        title={`${format(day, 'MMM do, yyyy')}: ${isCompleted ? 'Completed' : 'Missed'}`}
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
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-white/5"></div>
          <div className="w-3 h-3 rounded-sm bg-green-500/30"></div>
          <div className="w-3 h-3 rounded-sm bg-green-500/60"></div>
          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
