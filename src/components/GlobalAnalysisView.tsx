'use client';

import { differenceInDays, endOfYear, startOfYear } from 'date-fns';
import ProblemPieChart from './ProblemPieChart';
import Heatmap from './Heatmap';
import { ExternalLink, Plus } from 'lucide-react';
import clsx from 'clsx';
import { copyProblemToMyList } from '@/actions';
import { useState, useTransition } from 'react';

interface Problem {
  _id: string;
  title: string;
  link?: string;
  status: 'DONE' | 'ATTEMPTED' | 'PENDING';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  createdAt?: string;
  starred?: boolean;
  weekNumber?: number;
}

interface GlobalAnalysisViewProps {
  problems: Problem[];
  consistencyData: { date: string; isCompleted: boolean }[];
  showCopyButton?: boolean;
}

export default function GlobalAnalysisView({ problems, consistencyData, showCopyButton = false }: GlobalAnalysisViewProps) {
  
  const today = new Date();
  const daysLeftInYear = differenceInDays(endOfYear(today), today);
  const daysPassed = differenceInDays(today, startOfYear(today));
  
  // Calculate streaks
  const calculateStreak = () => {
    if (consistencyData.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort by date ascending
    const sortedData = [...consistencyData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate current streak (must be consecutive up to today or yesterday)
    // Work backwards from today
    let checkDate = new Date(today);
    
    // First check if today exists in the data
    const todayStr = today.toISOString().split('T')[0];
    const todayData = consistencyData.find(d => {
      const dDate = new Date(d.date);
      dDate.setHours(0, 0, 0, 0);
      return dDate.toISOString().split('T')[0] === todayStr;
    });
    
    // If today exists and is completed, start counting from today
    // Otherwise, start from yesterday
    if (todayData && todayData.isCompleted) {
      currentStreak = 1;
      checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    // Count backwards for current streak
    for (let i = 0; i < 180; i++) { // Max 180 days back
      const checkDateStr = checkDate.toISOString().split('T')[0];
      const dayData = consistencyData.find(d => {
        const dDate = new Date(d.date);
        dDate.setHours(0, 0, 0, 0);
        return dDate.toISOString().split('T')[0] === checkDateStr;
      });
      
      if (dayData && dayData.isCompleted) {
        currentStreak++;
        checkDate = new Date(checkDate);
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Calculate longest streak
    for (const day of sortedData) {
      if (day.isCompleted) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    return { currentStreak, longestStreak };
  };

  const { currentStreak, longestStreak } = calculateStreak();
  
  // Problem stats by status
  const problemsByStatus = {
    done: problems.filter(p => p.status === 'DONE').length,
    attempted: problems.filter(p => p.status === 'ATTEMPTED').length,
    pending: problems.filter(p => p.status === 'PENDING').length,
    starred: problems.filter(p => p.starred).length,
  };

  // Weekly average
  const weeksTracked = Math.ceil(consistencyData.length / 7);
  const avgProblemsPerWeek = weeksTracked > 0 ? (problems.length / weeksTracked).toFixed(1) : '0';

  // Sort problems by week number and creation date
  const sortedProblems = [...problems].sort((a, b) => {
    if (a.weekNumber && b.weekNumber) {
      return a.weekNumber - b.weekNumber;
    }
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-6 rounded-2xl bg-primary/10 border-primary/20">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Year Progress</div>
              <div className="text-4xl font-bold text-primary">{daysPassed} <span className="text-lg text-muted-foreground font-normal">days</span></div>
              <div className="text-xs text-muted-foreground mt-2">{daysLeftInYear} days remaining</div>
          </div>
          
          <div className="glass-card p-6 rounded-2xl">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Current Streak</div>
              <div className="text-4xl font-bold">{currentStreak} <span className="text-lg text-muted-foreground font-normal">days</span></div>
              <div className="text-xs text-muted-foreground mt-2">Keep it going! 🔥</div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Longest Streak</div>
              <div className="text-4xl font-bold">{longestStreak} <span className="text-lg text-muted-foreground font-normal">days</span></div>
              <div className="text-xs text-muted-foreground mt-2">Personal best 🏆</div>
          </div>
           
           <div className="glass-card p-6 rounded-2xl">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Overall Consistency</div>
              <div className="text-4xl font-bold">
                  {Math.round((consistencyData.filter(d => d.isCompleted).length / Math.max(1, consistencyData.length)) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground mt-2">Completion rate</div>
          </div>
      </div>

      {/* Problems Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="glass-card p-6 rounded-2xl">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Total Problems</div>
              <div className="text-4xl font-bold">{problems.length}</div>
              <div className="text-xs text-muted-foreground mt-2">Across all weeks</div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Completed</div>
              <div className="text-4xl font-bold text-green-500">{problemsByStatus.done}</div>
              <div className="text-xs text-muted-foreground mt-2">{problemsByStatus.attempted} attempted, {problemsByStatus.pending} pending</div>
          </div>

          <div className="glass-card p-6 rounded-2xl">
              <div className="text-muted-foreground text-xs uppercase font-bold mb-1">Weekly Average</div>
              <div className="text-4xl font-bold">{avgProblemsPerWeek}</div>
              <div className="text-xs text-muted-foreground mt-2">Problems per week</div>
          </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ProblemPieChart problems={problems} />
          
          {/* Additional Stats Card */}
          <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-lg font-bold mb-6">Problem Status Breakdown</h3>
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                          <span className="text-sm">Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{problemsByStatus.done}</span>
                          <span className="text-xs text-muted-foreground">
                              ({problems.length > 0 ? Math.round((problemsByStatus.done / problems.length) * 100) : 0}%)
                          </span>
                      </div>
                  </div>

                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-sm">Pending</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{problemsByStatus.pending}</span>
                          <span className="text-xs text-muted-foreground">
                              ({problems.length > 0 ? Math.round((problemsByStatus.pending / problems.length) * 100) : 0}%)
                          </span>
                      </div>
                  </div>

                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span className="text-sm">Attempted</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{problemsByStatus.attempted}</span>
                          <span className="text-xs text-muted-foreground">
                              ({problems.length > 0 ? Math.round((problemsByStatus.attempted / problems.length) * 100) : 0}%)
                          </span>
                      </div>
                  </div>

                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-sm">Starred</span>
                      </div>
                      <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{problemsByStatus.starred}</span>
                          <span className="text-xs text-muted-foreground">
                              ({problems.length > 0 ? Math.round((problemsByStatus.starred / problems.length) * 100) : 0}%)
                          </span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

       {/* Heatmap */}
       <Heatmap data={consistencyData} />

       {/* All Problems List */}
       {problems.length > 0 && (
         <div className="glass-card p-8 rounded-2xl">
           <h2 className="text-2xl font-bold mb-6 text-primary">All Questions ({problems.length})</h2>
           <div className="space-y-2">
             {sortedProblems.map((problem) => (
               <ProblemRow key={problem._id} problem={problem} showCopyButton={showCopyButton} />
             ))}
           </div>
         </div>
       )}
    </div>
  );
}

function ProblemRow({ problem, showCopyButton }: { problem: Problem; showCopyButton: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    startTransition(async () => {
      await copyProblemToMyList({
        title: problem.title,
        link: problem.link,
        difficulty: problem.difficulty
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center justify-between bg-black/20 hover:bg-black/30 p-4 rounded-lg border border-transparent hover:border-white/5 transition-all group">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Status Indicator */}
        <div className={clsx(
          "w-3 h-3 rounded-full flex-shrink-0",
          problem.status === 'DONE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
          problem.status === 'ATTEMPTED' ? 'bg-blue-500' : 'bg-yellow-500'
        )} />
        
        {/* Week Number */}
        {problem.weekNumber && (
          <span className="text-xs font-mono text-muted-foreground bg-white/5 px-2 py-1 rounded flex-shrink-0">
            W{problem.weekNumber}
          </span>
        )}
        
        {/* Title */}
        <div className="flex-1 min-w-0">
          {problem.link ? (
            <a 
              href={problem.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-medium hover:text-primary transition-colors truncate flex items-center gap-2"
            >
              <span className="truncate">{problem.title}</span>
              <ExternalLink size={14} className="text-muted-foreground flex-shrink-0" />
            </a>
          ) : (
            <span className="font-medium truncate block">{problem.title}</span>
          )}
        </div>
      </div>

      {/* Right side: Difficulty + Copy Button */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {problem.difficulty && (
          <span className={clsx(
            "text-xs px-3 py-1 rounded-full font-medium",
            problem.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
            problem.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
            'bg-red-500/20 text-red-500 border border-red-500/30'
          )}>
            {problem.difficulty}
          </span>
        )}
        
        {showCopyButton && (
          <button
            onClick={handleCopy}
            disabled={isPending || copied}
            className={clsx(
              "px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-200 flex items-center gap-1.5",
              copied 
                ? "bg-green-500/20 text-green-500 border border-green-500/30"
                : "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 hover:border-primary/50 hover:scale-105 active:scale-95"
            )}
          >
            <Plus size={14} className={copied ? "" : "group-hover:rotate-90 transition-transform"} />
            <span className="hidden sm:inline">{copied ? 'Added!' : 'Add to My List'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
