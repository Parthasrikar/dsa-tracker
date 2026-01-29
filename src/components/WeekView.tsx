'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Save, PenLine, Target, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { toggleDayCompletion, updateDayContent, updateWeekGoal, updateWeekReflection, addProblem, deleteProblem } from '@/actions';

// Types (simplified for client prop usage)
import AnalysisView from './AnalysisView';

// Types (simplified for client prop usage)
type Problem = {
  _id: string;
  title: string;
  link?: string;
  status: 'DONE' | 'ATTEMPTED' | 'PENDING';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  starred?: boolean;
};

type Day = {
  _id: string;
  dayName: string;
  date: string; // serialized date
  isCompleted: boolean;
  notes: string;
  plan: string;
  problems?: Problem[];
};

type Week = {
  _id: string;
  weekNumber: number;
  startDate: string;
  goals: string;
  satisfaction: number;
  reflection: string;
};

interface WeekViewProps {
  week: Week;
  days: Day[];
  consistencyData: { date: string; isCompleted: boolean }[];
}

export default function WeekView({ week, days, consistencyData }: WeekViewProps) {
  const [activeTab, setActiveTab] = useState<'planner' | 'analysis'>('planner');
  const [goals, setGoals] = useState(week.goals || '');
  const [reflection, setReflection] = useState(week.reflection || '');
  const [satisfaction, setSatisfaction] = useState(week.satisfaction || 5);
  const [expandedDay, setExpandedDay] = useState<string | null>(days.find(d => new Date(d.date).toDateString() === new Date().toDateString())?._id || days[0]?._id);
  const [addingProblemToDay, setAddingProblemToDay] = useState<string | null>(null);

  // Optimistic updates could be added here, but for simplicity we rely on revalidatePath in actions + router refresh
  // Actually, router refresh is needed if we want to see server data back, but direct mutation works on server
  // We'll use local state for inputs to avoid lag.

  const handleDayToggle = async (day: Day) => {
    // Optimistic UI toggle could be done here if needed
    await toggleDayCompletion(day._id, !day.isCompleted);
    // Force refresh or just let next.js handle it? server actions usually rely on revalidatePath
  };

  // Collect all problems for analysis
  const allProblems = days.flatMap(d => d.problems || []);

  // Filter consistency data to only this week's dates
  const weekDates = days.map(d => new Date(d.date).toISOString().split('T')[0]);
  const weekConsistencyData = consistencyData.filter(cd => {
    const cdDate = new Date(cd.date).toISOString().split('T')[0];
    return weekDates.includes(cdDate);
  });

  return (
    <div className="space-y-6 p-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
          <button 
              onClick={() => setActiveTab('planner')}
              className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'planner' ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5"
              )}
          >
              Daily Planner
          </button>
          <button 
              onClick={() => setActiveTab('analysis')}
              className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'analysis' ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5"
              )}
          >
              Analysis & Insights
          </button>
      </div>

      {activeTab === 'analysis' ? (
          <AnalysisView 
            problems={allProblems} 
            consistencyData={weekConsistencyData} 
            isWeeklyView={true}
            weekData={week}
            daysData={days}
          />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar: Goals & Reflection */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Goals Card */}
            <div className="glass-card p-6 rounded-2xl space-y-4 sticky top-24">
              <div className="flex items-center gap-2 text-primary">
                <Target />
                <h2 className="text-xl font-bold">Week Goals</h2>
              </div>
              <textarea
                className="w-full bg-black/20 rounded-lg p-3 text-sm focus:ring-1 ring-primary outline-none min-h-[150px] resize-none border-none"
                placeholder="What do you want to achieve this week?"
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                onBlur={() => updateWeekGoal(week._id, goals)}
              />
              <div className="flex justify-end text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Save size={12}/> Auto-saves on blur</span>
              </div>
            </div>

            {/* Reflection Card (Shown always or only end of week? Always good to have accessible) */}
            <div className="glass-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <PenLine />
                <h2 className="text-xl font-bold">Weekly Reflection</h2>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase text-muted-foreground">Satisfaction (1-10)</label>
                <div className="flex gap-2 bg-black/20 p-2 rounded-lg justify-between">
                  {[1,2,3,4,5,6,7,8,9,10].map(num => (
                    <button
                      key={num}
                      onClick={() => {
                          setSatisfaction(num);
                          updateWeekReflection(week._id, { reflection, satisfaction: num });
                      }}
                      className={clsx(
                        "w-6 h-6 rounded text-xs font-bold transition-all",
                        satisfaction === num ? "bg-primary text-white scale-125" : "text-muted-foreground hover:text-white"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                className="w-full bg-black/20 rounded-lg p-3 text-sm focus:ring-1 ring-primary outline-none min-h-[150px] resize-none border-none"
                placeholder="How did the week go? What went well? What didn't?"
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                onBlur={() => updateWeekReflection(week._id, { reflection, satisfaction })}
              />
            </div>
          </div>

          {/* Main Content: Days Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold mb-6">Daily Log</h2>
            
            <div className="space-y-4">
              {days.map((day) => {
                const isExpanded = expandedDay === day._id;
                const dateObj = new Date(day.date);

                return (
                  <div 
                    key={day._id} 
                    className={clsx(
                      "border rounded-2xl transition-all duration-300 overflow-hidden",
                      day.isCompleted 
                        ? "bg-green-500/5 border-green-500/20" 
                        : isExpanded ? "bg-card border-primary/50 shadow-lg" : "bg-card/50 border-white/5 hover:bg-card"
                    )}
                  >
                    {/* Day Header */}
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedDay(isExpanded ? null : day._id)}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDayToggle(day);
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          {day.isCompleted ? (
                            <CheckCircle2 className="text-green-500 w-8 h-8" />
                          ) : (
                            <Circle className="w-8 h-8" />
                          )}
                        </button>
                        <div>
                          <h3 className={clsx("text-lg font-bold", day.isCompleted && "text-green-500")}>
                            {day.dayName}
                          </h3>
                          <p className="text-xs text-muted-foreground">{format(dateObj, 'MMM do')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                         {/* Preview of plan/notes if collapsed */}
                         {!isExpanded && (day.plan || day.notes) && (
                            <div className="hidden md:flex gap-2 text-xs text-muted-foreground">
                                {day.plan && <span className="px-2 py-1 bg-white/5 rounded">Has Plan</span>}
                                {day.notes && <span className="px-2 py-1 bg-white/5 rounded">Has Notes</span>}
                            </div>
                         )}
                         {isExpanded ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <div className={clsx("grid transition-all duration-300", isExpanded ? "grid-rows-[1fr] opacity-100 p-4 border-t border-white/5" : "grid-rows-[0fr] opacity-0 h-0")}>
                        <div className="overflow-hidden space-y-4">
                            <DayInput 
                                label="Plan for the day" 
                                initialValue={day.plan} 
                                onSave={(val) => updateDayContent(day._id, { plan: val, notes: day.notes })} 
                                placeholder="Data Structures to cover..." 
                            />
                            <DayInput 
                                label="Daily Notes / Journal" 
                                initialValue={day.notes} 
                                onSave={(val) => updateDayContent(day._id, { notes: val, plan: day.plan })} 
                                placeholder="Problems solved, concepts learned..." 
                                minHeight="min-h-[120px]"
                            />
                        </div>
                        
                        {/* Questions Section */}
                         <div className="mt-6 border-t border-white/5 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                                    <span>Questions / Problems</span>
                                    <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full">{day.problems?.length || 0}</span>
                                </h4>
                                <button 
                                    onClick={() => setAddingProblemToDay(day._id)} 
                                    className="text-xs flex items-center gap-1 hover:text-white px-2 py-1 hover:bg-white/5 rounded transition-colors"
                                >
                                    <Plus size={14}/> Add New
                                </button>
                            </div>
                            
                            <div className="space-y-2 mb-4">
                                {day.problems?.map(p => (
                                    <div key={p._id} className="group flex items-center justify-between bg-black/20 hover:bg-black/30 p-3 rounded-lg text-sm border border-transparent hover:border-white/5 transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                             <div className={clsx("w-2 h-2 rounded-full shrink-0", 
                                                 p.status === 'DONE' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 
                                                 p.status === 'ATTEMPTED' ? 'bg-blue-500' : 'bg-yellow-500'
                                             )}></div>
                                             <div className="flex flex-col truncate">
                                                <a href={p.link || '#'} target="_blank" className="hover:text-primary transition-colors truncate font-medium flex items-center gap-1">
                                                    {p.title}
                                                    {p.link && <ExternalLink size={10} className="text-muted-foreground"/>}
                                                </a>
                                             </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className={clsx("text-[10px] px-2 py-0.5 rounded-full border", 
                                                p.difficulty === 'Easy' ? 'border-green-500/30 text-green-500 bg-green-500/5' : 
                                                p.difficulty === 'Medium' ? 'border-yellow-500/30 text-yellow-500 bg-yellow-500/5' : 
                                                p.difficulty === 'Hard' ? 'border-red-500/30 text-red-500 bg-red-500/5' : 'border-white/10 text-muted-foreground'
                                            )}>
                                                {p.difficulty || 'N/A'}
                                            </span>
                                            <button 
                                                onClick={() => deleteProblem(p._id)}
                                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-1"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!day.problems || day.problems.length === 0) && (
                                    <div className="text-center py-4 text-xs text-muted-foreground bg-black/10 rounded-lg border border-dashed border-white/5">
                                        No questions added yet.
                                    </div>
                                )}
                            </div>

                            {/* Add Form */}
                            {addingProblemToDay === day._id && (
                                <AddProblemForm 
                                    dayId={day._id} 
                                    weekNumber={week.weekNumber} 
                                    onCancel={() => setAddingProblemToDay(null)} 
                                    onSuccess={() => setAddingProblemToDay(null)}
                                />
                            )}
                         </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DayInputProps {
    label: string;
    initialValue?: string;
    onSave: (val: string) => void;
    placeholder?: string;
    minHeight?: string;
}

function DayInput({ label, initialValue, onSave, placeholder, minHeight = "min-h-[80px]" }: DayInputProps) {
    const [val, setVal] = useState(initialValue || '');
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">{label}</label>
            <textarea
                className={`w-full bg-black/20 rounded-lg p-3 text-sm focus:ring-1 ring-primary outline-none resize-none border-none ${minHeight}`}
                placeholder={placeholder}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onBlur={() => onSave(val)}
            />
        </div>
    )
}

function AddProblemForm({ dayId, weekNumber, onCancel, onSuccess }: { dayId: string, weekNumber: number, onCancel: () => void, onSuccess: () => void }) {
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [difficulty, setDifficulty] = useState('Medium');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!title) return;
        setLoading(true);
        await addProblem({
            title,
            link,
            difficulty,
            weekNumber,
            status: 'PENDING',
            dayId
        });
        setLoading(false);
        onSuccess();
    };

    return (
        <form onSubmit={handleSubmit} className="bg-card p-4 rounded-xl border border-primary/20 space-y-3 animate-in zoom-in-95 duration-200">
            <h5 className="text-sm font-bold">Add New Question</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input 
                    autoFocus
                    placeholder="Problem Title" 
                    className="bg-black/20 rounded-lg p-2 text-sm border border-white/5 focus:border-primary outline-none"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <input 
                    placeholder="Link (optional)" 
                    className="bg-black/20 rounded-lg p-2 text-sm border border-white/5 focus:border-primary outline-none"
                    value={link}
                    onChange={e => setLink(e.target.value)}
                />
            </div>
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map(d => (
                        <button 
                            key={d}
                            type="button"
                            onClick={() => setDifficulty(d)}
                            className={clsx(
                                "text-xs px-3 py-1.5 rounded-full border transition-colors",
                                difficulty === d 
                                    ? d === 'Easy' ? "bg-green-500/20 border-green-500 text-green-500" :
                                      d === 'Medium' ? "bg-yellow-500/20 border-yellow-500 text-yellow-500" :
                                      "bg-red-500/20 border-red-500 text-red-500"
                                    : "border-white/10 text-muted-foreground hover:bg-white/5"
                            )}
                        >
                            {d}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-white px-3 py-1.5">Cancel</button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-primary text-white text-xs px-4 py-1.5 rounded-lg hover:bg-primary/80 disabled:opacity-50"
                    >
                        {loading ? 'Adding...' : 'Add Question'}
                    </button>
                </div>
            </div>
        </form>
    );
}
