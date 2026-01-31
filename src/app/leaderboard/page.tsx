import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { Day } from '@/models/Day';
import { Problem } from '@/models/Problem';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getOrSetCache, generateCacheKey } from '@/lib/cache';
import AddFriendButton from '@/components/AddFriendButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable cache for debugging

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
    const session = await getSession();
    if (!session || !session.user) {
        redirect('/login');
    }

    const { filter } = await searchParams;
    const isFriendsOnly = filter === 'friends';

    // Cache key depends on filter AND user context (for friend status checks, might need better caching strategy or fetch friend status separately)
    // Actually, caching the *entire* leaderboard HTML with specific friend statuses for THIS user is tricky.
    // Ideally, we fetch the raw leaderboard data (cached globally) and then decorate it with friend status (uncached per user).
    // Let's refactor to separate raw data fetch and user-specific decoration.

    const cacheKey = isFriendsOnly
        ? generateCacheKey('leaderboard', 'friends', session.user.id)
        : generateCacheKey('leaderboard', 'global');

    // 1. Fetch Raw Leaderboard Data (Cached)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawLeaderboardData = await getOrSetCache(cacheKey, async () => {
        await dbConnect();

        let userIdsToFetch: string[] = [];
        if (isFriendsOnly) {
            const currentUser = await User.findById(session.user.id).select('friends').lean();
            if (currentUser) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                userIdsToFetch = (currentUser as any).friends.map((id: any) => id.toString());
                userIdsToFetch.push(session.user.id);
            }
        }

        const [consistencyStats, problemStats, users] = await Promise.all([
            Day.aggregate([
                { $match: { isCompleted: true } },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $project: { _id: 1, count: 1 } }
            ]),
            Problem.aggregate([
                { $match: { status: 'DONE' } },
                { $group: { _id: '$userId', count: { $sum: 1 } } },
                { $project: { _id: 1, count: 1 } }
            ]),
            User.find(isFriendsOnly ? { _id: { $in: userIdsToFetch } } : {})
                .select('name username image email') // Added username
                .lean()
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const consistencyMap = new Map(consistencyStats.map((s: any) => [s._id.toString(), s.count]));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const problemMap = new Map(problemStats.map((s: any) => [s._id.toString(), s.count]));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = users.map((u: any) => {
            const uid = u._id.toString();
            return {
                id: uid,
                name: u.name,
                username: u.username, // Added username
                image: u.image,
                consistency: consistencyMap.get(uid) || 0,
                problemsSolved: problemMap.get(uid) || 0
            };
        });

        data.sort((a, b) => {
            if (b.consistency !== a.consistency) {
                return b.consistency - a.consistency;
            }
            return b.problemsSolved - a.problemsSolved;
        });

        return data;
    }, 60);

    // 2. Fetch User-Specific Friend Data (Uncached / separate)
    await dbConnect();
    const currentUser = await User.findById(session.user.id).select('friends').lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const friendIds = new Set((currentUser as any)?.friends?.map((id: any) => id.toString()) || []);

    // 3. Decorate Data
    const leaderboardData = rawLeaderboardData.map(user => {
        const isFriend = friendIds.has(user.id);
        console.log(`User ${user.name} (${user.id}): isFriend=${isFriend}, friendIds size=${friendIds.size}`);
        return {
            ...user,
            isFriend
        };
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
                        className={`glass-card p-4 rounded-xl transition-transform hover:scale-[1.01] ${user.id === session.user.id ? 'border-primary/50 bg-primary/5' : ''}`}
                    >
                        <div className="flex items-center gap-3 md:gap-4">
                            {/* Rank Badge */}
                            <div className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center font-bold text-lg md:text-xl rounded-full shrink-0 ${index < 3 ? 'text-white' : 'text-muted-foreground bg-muted/30'}`}
                                style={{
                                    backgroundColor: index === 0 ? '#EAB308' : index === 1 ? '#94A3B8' : index === 2 ? '#B45309' : undefined
                                }}
                            >
                                {index + 1}
                            </div>

                            {/* Name Section */}
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <Link href={`/profile/${user.id}`} className="font-bold text-base md:text-lg hover:underline decoration-primary truncate">
                                            {user.name}
                                        </Link>
                                        {user.id === session.user.id && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full shrink-0">You</span>}
                                    </div>
                                    {user.username && (
                                        <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
                                    )}
                                </div>
                            </div>

                            {/* Friend Button */}
                            <div className="flex items-center gap-2 shrink-0">
                                {user.id !== session.user.id ? (
                                    <>
                                        <AddFriendButton
                                            userId={user.id}
                                            isFriend={user.isFriend}
                                        />
                                        <span className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                                            TEST
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-xs text-muted-foreground">You</span>
                                )}
                            </div>

                            {/* Stats - Always visible on desktop */}
                            <div className="hidden md:flex items-center gap-4 shrink-0">
                                <div className="text-right px-4 border-l border-white/10">
                                    <div className="text-2xl font-bold">{user.consistency}</div>
                                    <div className="text-xs text-muted-foreground">Days</div>
                                </div>

                                <div className="text-right px-4 border-l border-white/10">
                                    <div className="text-2xl font-bold text-green-500">{user.problemsSolved}</div>
                                    <div className="text-xs text-muted-foreground">Solved</div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Stats and Button Row */}
                        <div className="flex md:hidden items-center justify-between mt-3 pt-3 border-t border-white/10">
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <div className="text-xl font-bold">{user.consistency}</div>
                                    <div className="text-xs text-muted-foreground">Days</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-green-500">{user.problemsSolved}</div>
                                    <div className="text-xs text-muted-foreground">Solved</div>
                                </div>
                            </div>

                            {user.id !== session.user.id && (
                                <AddFriendButton
                                    userId={user.id}
                                    isFriend={user.isFriend}
                                />
                            )}
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
