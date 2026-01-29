import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Day } from '@/models/Day';
import { Problem } from '@/models/Problem';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  const { filter } = await searchParams;
  const isFriendsOnly = filter === 'friends';

  await dbConnect();

  let userIdsToFetch: string[] = [];
  
  if (isFriendsOnly) {
     const currentUser = await User.findById(session.user.id);
     if (currentUser) {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         userIdsToFetch = currentUser.friends.map((id: any) => id.toString());
         userIdsToFetch.push(session.user.id); // Include self
     }
  }

  // Aggregate Consistency (Total Days Completed)
  const consistencyStats = await Day.aggregate([
      { $match: { isCompleted: true } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
  ]);

  // Aggregate Problems Solved
  const problemStats = await Problem.aggregate([
      { $match: { status: 'DONE' } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
  ]);

  // Create Maps for O(1) lookup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const consistencyMap = new Map(consistencyStats.map((s: any) => [s._id.toString(), s.count]));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const problemMap = new Map(problemStats.map((s: any) => [s._id.toString(), s.count]));

  // Fetch Users
  const query = isFriendsOnly ? { _id: { $in: userIdsToFetch } } : {};
  const users = await User.find(query).select('name image email').lean();

  // Combine Data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaderboardData = users.map((u: any) => {
      const uid = u._id.toString();
      return {
          id: uid,
          name: u.name,
          image: u.image,
          consistency: consistencyMap.get(uid) || 0,
          problemsSolved: problemMap.get(uid) || 0
      };
  });

  // Sort by Consistency (primary) then Problems (secondary)
  leaderboardData.sort((a, b) => {
      if (b.consistency !== a.consistency) {
          return b.consistency - a.consistency;
      }
      return b.problemsSolved - a.problemsSolved;
  });

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">Leaderboard</h1>
            <p className="text-muted-foreground">Top performers based on consistency.</p>
        </div>
        
        <div className="flex bg-muted/20 p-1 rounded-lg">
            <Link 
                href="/leaderboard" 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${!isFriendsOnly ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
                Global
            </Link>
            <Link 
                href="/leaderboard?filter=friends" 
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${isFriendsOnly ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
                Friends Only
            </Link>
        </div>
      </div>

      <div className="space-y-4">
        {leaderboardData.map((user, index) => (
            <div 
                key={user.id} 
                className={`glass-card p-4 rounded-xl flex items-center gap-4 transition-transform hover:scale-[1.01] ${user.id === session.user.id ? 'border-primary/50 bg-primary/5' : ''}`}
            >
                <div className={`w-12 h-12 flex items-center justify-center font-bold text-xl rounded-full ${index < 3 ? 'text-white' : 'text-muted-foreground bg-muted/30'}`}
                     style={{
                         backgroundColor: index === 0 ? '#EAB308' : index === 1 ? '#94A3B8' : index === 2 ? '#B45309' : undefined
                     }}
                >
                    {index + 1}
                </div>
                
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <Link href={`/profile/${user.id}`} className="font-bold text-lg hover:underline decoration-primary">
                            {user.name}
                        </Link>
                        {user.id === session.user.id && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">You</span>}
                    </div>
                </div>

                <div className="text-right px-4 border-l border-white/10">
                    <div className="text-2xl font-bold">{user.consistency}</div>
                    <div className="text-xs text-muted-foreground">Days</div>
                </div>

                 <div className="text-right px-4 border-l border-white/10 hidden sm:block">
                    <div className="text-2xl font-bold text-green-500">{user.problemsSolved}</div>
                    <div className="text-xs text-muted-foreground">Solved</div>
                </div>
            </div>
        ))}

        {leaderboardData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
                No users found.
            </div>
        )}
      </div>
    </div>
  );
}
