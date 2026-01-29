'use client';

import { differenceInDays, endOfYear, endOfWeek } from 'date-fns';
import ProblemPieChart from './ProblemPieChart';
import Heatmap from './Heatmap';

interface Problem {
  _id: string;
  title: string;
  link?: string;
  status: 'DONE' | 'ATTEMPTED' | 'PENDING';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  starred?: boolean;
  notes?: string;
}

interface Day {
  _id: string;
  dayName: string;
  date: string;
  isCompleted: boolean;
  notes?: string;
  plan?: string;
  problems?: Problem[];
}

interface WeekData {
  _id: string;
  weekNumber: number;
  startDate: string;
  goals?: string;
  satisfaction?: number;
  reflection?: string;
}

interface AnalysisViewProps {
  problems: Problem[];
  consistencyData: { date: string; isCompleted: boolean }[];
  isWeeklyView?: boolean;
  weekData?: WeekData;
  daysData?: Day[];
}

export default function AnalysisView({ problems, consistencyData, isWeeklyView = false, weekData, daysData }: AnalysisViewProps) {
  
  const today = new Date();
  const daysLeftInYear = differenceInDays(endOfYear(today), today);
  const daysLeftInWeek = differenceInDays(endOfWeek(today, { weekStartsOn: 1 }), today);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Cards: Remaining Days */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-2xl bg-primary/10 border-primary/20">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Year Remaining</div>
              <div className="text-4xl font-bold text-primary">{daysLeftInYear} <span className="text-lg text-muted-foreground font-normal">days</span></div>
              <div className="text-xs text-muted-foreground mt-2">Make them count.</div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Week Remaining</div>
              <div className="text-4xl font-bold">{Math.max(0, daysLeftInWeek)} <span className="text-lg text-muted-foreground font-normal">days</span></div>
              <div className="text-xs text-muted-foreground mt-2">To hit weekly goals.</div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Total Solved</div>
              <div className="text-4xl font-bold">{problems.length} <span className="text-lg text-muted-foreground font-normal">problems</span></div>
              <div className="text-xs text-muted-foreground mt-2">Keep pushing!</div>
          </div>
           
           <div className="glass-card p-6 rounded-2xl">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Consistency</div>
              <div className="text-4xl font-bold">
                  {Math.round((consistencyData.filter(d => d.isCompleted).length / Math.max(1, consistencyData.length)) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground mt-2">Completion rate {isWeeklyView ? '(this week)' : '(last 6mo)'}</div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProblemPieChart problems={problems} />
      </div>

       {/* Heatmap - Only show for global view, not weekly */}
       {!isWeeklyView && <Heatmap data={consistencyData} />}

       {/* Weekly Summary - Only show for weekly view */}
       {isWeeklyView && weekData && daysData && (
         <div className="glass-card p-8 rounded-2xl space-y-8">
           <h2 className="text-2xl font-bold text-primary">Week Summary</h2>

           {/* Week Goals */}
           {weekData.goals && (
             <div className="space-y-2">
               <h3 className="text-lg font-bold text-foreground">📋 Week Goals</h3>
               <p className="text-muted-foreground whitespace-pre-wrap bg-black/20 p-4 rounded-lg">
                 {weekData.goals}
               </p>
             </div>
           )}

           {/* Daily Breakdown */}
           <div className="space-y-6">
             {daysData.map((day) => {
               const hasPlan = day.plan && day.plan.trim();
               const hasNotes = day.notes && day.notes.trim();
               const hasProblems = day.problems && day.problems.length > 0;
               
               // Skip if day has no content
               if (!hasPlan && !hasNotes && !hasProblems) return null;

               return (
                 <div key={day._id} className="border-l-4 border-primary/30 pl-6 space-y-3">
                   <h3 className="text-lg font-bold flex items-center gap-2">
                     <span className="text-primary">{day.dayName}</span>
                     <span className="text-xs text-muted-foreground">
                       {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                     </span>
                   </h3>

                   {/* Plan */}
                   {hasPlan && (
                     <div className="space-y-1">
                       <h4 className="text-sm font-semibold text-muted-foreground uppercase">Plan</h4>
                       <p className="text-sm text-foreground bg-black/20 p-3 rounded-lg whitespace-pre-wrap">
                         {day.plan}
                       </p>
                     </div>
                   )}

                   {/* Problems */}
                   {hasProblems && (
                     <div className="space-y-2">
                       <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                         Questions ({day.problems!.length})
                       </h4>
                       <div className="space-y-2">
                         {day.problems!.map((problem) => (
                           <div key={problem._id} className="bg-black/20 p-3 rounded-lg space-y-2">
                             <div className="flex items-center gap-2">
                               <span className={`w-2 h-2 rounded-full ${
                                 problem.status === 'DONE' ? 'bg-green-500' :
                                 problem.status === 'ATTEMPTED' ? 'bg-blue-500' : 'bg-yellow-500'
                               }`} />
                               <span className="font-medium text-sm">{problem.title}</span>
                               {problem.difficulty && (
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                   problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
                                   problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500' :
                                   'bg-red-500/20 text-red-500'
                                 }`}>
                                   {problem.difficulty}
                                 </span>
                               )}
                             </div>
                             {problem.notes && (
                               <p className="text-xs text-muted-foreground pl-4 whitespace-pre-wrap">
                                 {problem.notes}
                               </p>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Journal */}
                   {hasNotes && (
                     <div className="space-y-1">
                       <h4 className="text-sm font-semibold text-muted-foreground uppercase">Journal</h4>
                       <p className="text-sm text-foreground bg-black/20 p-3 rounded-lg whitespace-pre-wrap">
                         {day.notes}
                       </p>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>

           {/* Week Reflection & Satisfaction */}
           {(weekData.reflection || weekData.satisfaction) && (
             <div className="border-t border-white/10 pt-6 space-y-4">
               <h3 className="text-lg font-bold text-foreground">💭 Week Reflection</h3>
               
               {weekData.satisfaction && (
                 <div className="flex items-center gap-3">
                   <span className="text-sm font-semibold text-muted-foreground">Satisfaction:</span>
                   <div className="flex items-center gap-1">
                     {[...Array(10)].map((_, i) => (
                       <div
                         key={i}
                         className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                           i < weekData.satisfaction! ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground'
                         }`}
                       >
                         {i + 1}
                       </div>
                     ))}
                   </div>
                 </div>
               )}

               {weekData.reflection && (
                 <p className="text-muted-foreground whitespace-pre-wrap bg-black/20 p-4 rounded-lg">
                   {weekData.reflection}
                 </p>
               )}
             </div>
           )}
         </div>
       )}
    </div>
  );
}
