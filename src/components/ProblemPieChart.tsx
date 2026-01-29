'use client';

import { useMemo } from 'react';
import { clsx } from 'clsx';

interface Problem {
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

interface ProblemPieChartProps {
  problems: Problem[];
}

export default function ProblemPieChart({ problems }: ProblemPieChartProps) {
  const data = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };
    problems.forEach(p => {
      if (p.difficulty && counts[p.difficulty] !== undefined) {
        counts[p.difficulty]++;
      }
    });
    
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { counts, total };
  }, [problems]);

  // SVG parameters
  const size = 160;
  const center = size / 2;
  const radius = size / 2 - 10;
  let currentAngle = 0;

  if (data.total === 0) {
      return (
          <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center h-full min-h-[200px]">
             <h3 className="text-lg font-bold mb-2">Problem Distribution</h3>
             <p className="text-muted-foreground text-sm">No data yet</p>
          </div>
      )
  }

  const slices = Object.entries(data.counts).map(([label, value]) => {
      if (value === 0) return null;
      
      const percentage = value / data.total;
      const angle = percentage * 360;
      
      // Calculate path
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle += angle;

      // Coordinates
      const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
      const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
      const x2 = center + radius * Math.cos(Math.PI * endAngle / 180);
      const y2 = center + radius * Math.sin(Math.PI * endAngle / 180);

      // Flag for large arc
      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = [
          `M ${center} ${center}`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
      ].join(' ');

      const color = label === 'Easy' ? '#22c55e' : label === 'Medium' ? '#eab308' : '#ef4444';

      return { pathData, color, label, value, percentage };
  }).filter(Boolean);

  return (
    <div className="glass-card p-6 rounded-2xl">
      <h3 className="text-lg font-bold mb-6">Problem Difficulty</h3>
      <div className="flex items-center gap-8">
          <div className="relative">
             <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                {slices.map((slice, i) => (
                    <path 
                        key={i} 
                        d={slice!.pathData} 
                        fill={slice!.color} 
                        className="hover:opacity-80 transition-opacity cursor-pointer"
                    >
                        <title>{`${slice!.label}: ${slice!.value} (${Math.round(slice!.percentage * 100)}%)`}</title>
                    </path>
                ))}
             </svg>
             {/* Donut hole for modern look */}
             <div className="absolute inset-0 m-auto w-[60%] h-[60%] bg-background rounded-full flex items-center justify-center">
                 <div className="text-center">
                     <div className="text-2xl font-bold">{data.total}</div>
                     <div className="text-[10px] text-muted-foreground uppercase">Total</div>
                 </div>
             </div>
          </div>
          
          <div className="space-y-3 flex-1">
              {(['Easy', 'Medium', 'Hard'] as const).map(difficulty => (
                  <div key={difficulty} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                          <div className={clsx("w-3 h-3 rounded-full", 
                             difficulty === 'Easy' ? 'bg-green-500' : 
                             difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                          )}/>
                          <span>{difficulty}</span>
                      </div>
                      <span className="font-bold">{data.counts[difficulty]}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
}
