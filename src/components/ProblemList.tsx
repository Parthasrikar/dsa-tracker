'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, ExternalLink, CheckCircle2, Clock, Star, CircleDot, Search, X, Tag, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { addProblem, updateProblemStatus, deleteProblem, toggleProblemStar, updateProblemTags, updateProblemNotes, copyProblemToMyList } from '@/actions';

// Types
type Problem = {
  _id: string;
  title: string;
  link?: string;
  notes?: string;
  status: 'DONE' | 'ATTEMPTED' | 'PENDING';
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  weekNumber: number;
  starred?: boolean;
  tags?: string[];
  rating?: number;
  createdAt?: string;
};

type SortOption = 'recent' | 'oldest' | 'rating-high' | 'rating-low' | 'title';

type GlobalProblem = {
  _id: string; // usually the link
  title: string;
  link?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  tags?: string[];
  count: number;
};


export default function ProblemList({ initialProblems, globalProblems = [] }: { initialProblems: Problem[], globalProblems?: GlobalProblem[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'my' | 'global'>('my');

  // existing state ...
  const [filter, setFilter] = useState<'ALL' | 'DONE' | 'ATTEMPTED' | 'PENDING' | 'STARRED'>('ALL');
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // New problem form state
  const [newTitle, setNewTitle] = useState('');
  const [newLink, setNewLink] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDifficulty, setNewDifficulty] = useState('Medium');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  // Get all unique tags from problems (based on active tab?)
  // Actually, filtering logic applies to "My Problems". Global problems might need their own simple filter or just search.
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    initialProblems.forEach(p => {
      p.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [initialProblems]);

  // Filter and sort problems (My Problems)
  const filteredProblems = useMemo(() => {
    const filtered = initialProblems.filter(p => {
      // Status filter
      if (filter !== 'ALL') {
        if (filter === 'STARRED' && !p.starred) return false;
        if (filter !== 'STARRED' && p.status !== filter) return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesTags = p.tags?.some(tag => tag.toLowerCase().includes(query));
        if (!matchesTitle && !matchesTags) return false;
      }

      // Tag filter
      if (selectedTags.length > 0) {
        const hasTags = selectedTags.some(tag => p.tags?.includes(tag));
        if (!hasTags) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'rating-high':
          return (b.rating || 0) - (a.rating || 0);
        case 'rating-low':
          return (a.rating || 0) - (b.rating || 0);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [initialProblems, filter, searchQuery, selectedTags, sortBy]);

  // Filter Global Problems (Simple search)
  const filteredGlobalProblems = useMemo(() => {
    if (!searchQuery) return globalProblems;
    const query = searchQuery.toLowerCase();
    return globalProblems.filter(p =>
      p.title.toLowerCase().includes(query) ||
      p.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [globalProblems, searchQuery]);


  async function handleAdd() {
    if (!newTitle) return;

    await addProblem({
      title: newTitle,
      link: newLink,
      notes: newNotes,
      difficulty: newDifficulty,
      weekNumber: 1,
      status: 'PENDING',
      tags: newTags
    });

    setIsAdding(false);
    setNewTitle('');
    setNewLink('');
    setNewNotes('');
    setNewTags([]);
    router.refresh();
  }

  const addNewTag = () => {
    const cleanTag = newTagInput.trim().toLowerCase();
    if (cleanTag && !newTags.includes(cleanTag)) {
      setNewTags([...newTags, cleanTag]);
      setNewTagInput('');
    }
  };

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('my')}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'my' ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5"
          )}
        >
          My Problems
        </button>
        <button
          onClick={() => setActiveTab('global')}
          className={clsx(
            "px-4 py-2 rounded-lg text-sm font-bold transition-all",
            activeTab === 'global' ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5"
          )}
        >
          Global ({globalProblems.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="glass p-4 md:p-6 rounded-2xl space-y-4">

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder={activeTab === 'my' ? "Search your problems..." : "Search global problems..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 rounded-lg pl-10 pr-10 py-3 text-sm focus:ring-1 ring-primary outline-none border border-white/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Filter Tabs, Tag Filter, and Sort (Only for My Problems) */}
        {activeTab === 'my' && (
          <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">

            {/* Status Filter Tabs */}
            <div className="flex bg-black/20 p-1 rounded-lg overflow-x-auto no-scrollbar w-full md:w-auto max-w-full">
              {(['ALL', 'DONE', 'ATTEMPTED', 'PENDING', 'STARRED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "px-3 py-1.5 md:px-4 md:py-2 rounded-md text-xs md:text-sm font-bold transition-all whitespace-nowrap",
                    filter === f ? "bg-primary text-white shadow-lg" : "text-muted-foreground hover:text-white"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-center flex-wrap">
              {/* Tag Filter Dropdown - Only show if tags exist */}
              {allTags.length > 0 && (
                <select
                  value={selectedTags[0] || ''}
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleTagFilter(e.target.value);
                    }
                  }}
                  className="bg-black/20 rounded-lg px-4 py-2 text-sm border border-white/10 focus:border-primary outline-none"
                >
                  <option value="">Filter by Tag...</option>
                  {allTags.map(tag => (
                    <option key={tag} value={tag}>
                      {tag} {selectedTags.includes(tag) ? '✓' : ''}
                    </option>
                  ))}
                </select>
              )}

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-black/20 rounded-lg px-4 py-2 text-sm border border-white/10 focus:border-primary outline-none"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
                <option value="title">Title (A-Z)</option>
              </select>

              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg font-bold transition-colors whitespace-nowrap"
              >
                <Plus size={18} />
                Add Problem
              </button>
            </div>
          </div>
        )}

        {/* Selected Tags Display */}
        {activeTab === 'my' && selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Active filters:</span>
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs flex items-center gap-2"
              >
                {tag}
                <button
                  onClick={() => toggleTagFilter(tag)}
                  className="hover:text-white"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              onClick={() => setSelectedTags([])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Add Form (Only visible in My Problems if active) */}
      {activeTab === 'my' && (
        <div className={clsx("overflow-hidden transition-all duration-300", isAdding ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0")}>
          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-lg">Add New Problem</h3>

            <input
              placeholder="Problem Title"
              className="input-field w-full"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                placeholder="Link (LeetCode, etc.)"
                className="input-field"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
              />
              <select
                className="input-field"
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value)}
              >
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>

            <textarea
              placeholder="Notes (approach, key insights, edge cases, etc.)"
              className="input-field min-h-[100px] resize-y"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />

            {/* Tags Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase">Tags</label>
              <div className="flex gap-2">
                <input
                  placeholder="Add tag (e.g., array, dp, graph)"
                  className="input-field flex-1"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                />
                <button
                  type="button"
                  onClick={addNewTag}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                >
                  Add
                </button>
              </div>
              {newTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newTags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => setNewTags(newTags.filter(t => t !== tag))}
                        className="hover:text-white"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-muted-foreground hover:text-white">Cancel</button>
              <button onClick={handleAdd} className="bg-primary text-white px-6 py-2 rounded-lg font-bold">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {activeTab === 'my' ? (
          <>Showing {filteredProblems.length} of {initialProblems.length} specific problems</>
        ) : (
          <>Showing {filteredGlobalProblems.length} unique global problems</>
        )}
      </div>

      {/* List */}
      <div className="grid gap-4">
        {activeTab === 'my' ? (
          <>
            {filteredProblems.map((problem) => (
              <ProblemCard key={problem._id} problem={problem} router={router} />
            ))}
            {filteredProblems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No problems found matching your filters.
              </div>
            )}
          </>
        ) : (
          <>
            {filteredGlobalProblems.map((problem) => (
              <GlobalProblemCard key={problem._id} problem={problem} router={router} />
            ))}
            {filteredGlobalProblems.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                No global problems found.
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}

function GlobalProblemCard({ problem, router }: { problem: GlobalProblem; router: ReturnType<typeof useRouter> }) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAddToMyList() {
    setLoading(true);
    try {
      await copyProblemToMyList({
        title: problem.title,
        link: problem.link,
        difficulty: problem.difficulty
      });
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 group hover:border-primary/30 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-bold text-lg truncate">{problem.title}</h3>
          {problem.link && (
            <a href={problem.link} target="_blank" className="text-muted-foreground hover:text-primary">
              <ExternalLink size={14} />
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className={clsx(
            "font-bold",
            problem.difficulty === 'Easy' ? "text-green-400" :
              problem.difficulty === 'Medium' ? "text-yellow-400" : "text-red-400"
          )}>
            {problem.difficulty}
          </span>
          <span className="bg-white/5 px-2 py-0.5 rounded flex items-center gap-1">
            Solved by {problem.count} others
          </span>
          {problem.tags && problem.tags.slice(0, 3).map(tag => (
            <span key={tag} className="bg-primary/10 text-primary px-2 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      </div>
      <button
        onClick={handleAddToMyList}
        disabled={loading || added}
        className="flex items-center gap-2 bg-primary/20 hover:bg-primary text-primary hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
      >
        {added ? <CheckCircle2 size={16} /> : <Plus size={16} />}
        {added ? 'Added!' : 'Add to My List'}
      </button>
    </div>
  );
}

function ProblemCard({ problem, router }: { problem: Problem; router: ReturnType<typeof useRouter> }) {
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [editTags, setEditTags] = useState<string[]>(problem.tags || []);
  const [optimisticTags, setOptimisticTags] = useState<string[]>(problem.tags || []);

  const [editTagInput, setEditTagInput] = useState('');
  const [editRating, setEditRating] = useState(problem.rating || 0);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editNotes, setEditNotes] = useState(problem.notes || '');
  const [showNotes, setShowNotes] = useState(false);

  // Sync optimistic tags with server data when it updates
  useEffect(() => {
    setOptimisticTags(problem.tags || []);
  }, [problem.tags]);

  const saveTags = async () => {
    console.log('Saving tags:', { id: problem._id, tags: editTags, rating: editRating });
    // Optimistic update
    setOptimisticTags(editTags);
    setIsEditingTags(false);

    await updateProblemTags(problem._id, editTags, editRating || undefined);
    router.refresh();
  };

  const saveNotes = async () => {
    await updateProblemNotes(problem._id, editNotes);
    setIsEditingNotes(false);
    setShowNotes(true);
    router.refresh();
  };

  const addEditTag = () => {
    const cleanTag = editTagInput.trim().toLowerCase();
    if (cleanTag && !editTags.includes(cleanTag)) {
      setEditTags([...editTags, cleanTag]);
      setEditTagInput('');
    }
  };

  return (
    <div className="glass-card p-4 rounded-xl group">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">

        <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
          <StatusBadge status={problem.status} id={problem._id} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-bold text-lg break-words">{problem.title}</h3>
              {problem.link && (
                <a href={problem.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary shrink-0">
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-2">
              <span className={clsx(
                "font-bold",
                problem.difficulty === 'Easy' ? "text-green-400" :
                  problem.difficulty === 'Medium' ? "text-yellow-400" : "text-red-400"
              )}>
                {problem.difficulty}
              </span>
              <span>Week {problem.weekNumber}</span>
              {problem.rating && (
                <span className="flex items-center gap-1">
                  {'⭐'.repeat(problem.rating || 0)}
                </span>
              )}
            </div>

            {/* Tags Display */}
            {!isEditingTags && optimisticTags && optimisticTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {optimisticTags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Tags Edit Mode */}
            {isEditingTags && (
              <div className="space-y-2 mb-2 p-3 bg-black/20 rounded-lg">
                <div className="flex gap-2">
                  <input
                    placeholder="Add tag"
                    className="input-field text-xs flex-1"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEditTag())}
                  />
                  <button onClick={addEditTag} className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded text-xs">
                    Add
                  </button>
                </div>
                {editTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {editTags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-primary/20 text-primary rounded text-xs flex items-center gap-1">
                        {tag}
                        <button onClick={() => setEditTags(editTags.filter(t => t !== tag))}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <label className="text-xs">Rating:</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(r => (
                      <button
                        key={r}
                        onClick={() => setEditRating(r)}
                        className={clsx("text-lg", editRating >= r ? "text-yellow-400" : "text-gray-600")}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveTags} className="px-3 py-1 bg-primary text-white rounded text-xs">Save</button>
                  <button onClick={() => setIsEditingTags(false)} className="px-3 py-1 bg-white/10 rounded text-xs">Cancel</button>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {!isEditingNotes && problem.notes && (
              <div className="mt-3 space-y-2">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  {showNotes ? '▼' : '▶'} Notes
                </button>
                {showNotes && (
                  <div className="p-3 bg-black/20 rounded-lg text-sm text-muted-foreground whitespace-pre-wrap">
                    {problem.notes}
                  </div>
                )}
              </div>
            )}

            {/* Notes Edit Mode */}
            {isEditingNotes && (
              <div className="mt-3 space-y-2 p-3 bg-black/20 rounded-lg">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Notes</label>
                <textarea
                  placeholder="Add notes about approach, key insights, edge cases, etc."
                  className="input-field min-h-[120px] resize-y w-full text-sm"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <button onClick={saveNotes} className="px-3 py-1 bg-primary text-white rounded text-xs">Save</button>
                  <button onClick={() => setIsEditingNotes(false)} className="px-3 py-1 bg-white/10 rounded text-xs">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto w-full sm:w-auto justify-end sm:justify-start">
          <button
            onClick={() => setIsEditingNotes(!isEditingNotes)}
            className={clsx(
              "p-2 transition-all",
              problem.notes
                ? "text-blue-400 hover:text-blue-500"
                : "text-muted-foreground hover:text-blue-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            )}
            title={problem.notes ? "Edit notes" : "Add notes"}
          >
            <FileText size={18} />
          </button>
          <button
            onClick={() => setIsEditingTags(!isEditingTags)}
            className="p-2 text-muted-foreground hover:text-primary transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            title="Edit tags"
          >
            <Tag size={18} />
          </button>
          <button
            onClick={async () => {
              await toggleProblemStar(problem._id, !!problem.starred);
              router.refresh();
            }}
            className={clsx(
              "p-2 transition-all",
              problem.starred
                ? "text-yellow-400 hover:text-yellow-500"
                : "text-muted-foreground hover:text-yellow-400 opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            )}
            title={problem.starred ? "Unstar" : "Star"}
          >
            <Star size={18} fill={problem.starred ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => deleteProblem(problem._id)}
            className="p-2 text-muted-foreground hover:text-red-500 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
          >
            <Trash2 size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}

function StatusBadge({ status, id }: { status: string, id: string }) {
  const [optimisticStatus, setOptimisticStatus] = useState(status);
  const router = useRouter();

  // Sync with server state provided via props
  useEffect(() => {
    setOptimisticStatus(status);
  }, [status]);

  const getIcon = () => {
    switch (optimisticStatus) {
      case 'DONE': return <CheckCircle2 size={20} />;
      case 'ATTEMPTED': return <CircleDot size={20} />;
      case 'PENDING': return <Clock size={20} />;
    }
  };

  const getColor = () => {
    switch (optimisticStatus) {
      case 'DONE': return 'text-green-500 bg-green-500/10';
      case 'ATTEMPTED': return 'text-blue-500 bg-blue-500/10';
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10';
    }
  };

  // Cycle: PENDING -> ATTEMPTED -> DONE -> PENDING
  const cycleStatus = async () => {
    const next =
      optimisticStatus === 'PENDING' ? 'ATTEMPTED' :
        optimisticStatus === 'ATTEMPTED' ? 'DONE' : 'PENDING';

    // Optimistic update
    setOptimisticStatus(next);

    await updateProblemStatus(id, next);
    router.refresh();
  };

  return (
    <button onClick={cycleStatus} className={clsx("p-2 rounded-full transition-colors shrink-0", getColor())}>
      {getIcon()}
    </button>
  );
}
