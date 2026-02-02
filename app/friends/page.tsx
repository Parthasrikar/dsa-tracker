import { getSession } from '@/lib/auth';
import { User } from '@/models/User';
import { FriendRequest } from '@/models/FriendRequest';
import dbConnect from '@/lib/db';
import { redirect } from 'next/navigation';
import AddFriend from '@/components/AddFriend';
import FriendRequestItem from '@/components/FriendRequestItem';
import Link from 'next/link';

import { getOrSetCache, generateCacheKey } from '@/lib/cache';

export const dynamic = 'force-dynamic';
export const revalidate = 30; // Revalidate every 30 seconds

export default async function FriendsPage() {
  const session = await getSession();
  if (!session || !session.user) {
    redirect('/login');
  }

  // Fetch with Redis Cache
  const [user, pendingRequests] = await getOrSetCache(
    generateCacheKey('friends', 'page', session.user.id),
    async () => {
      await dbConnect();
      return await Promise.all([
        User.findById(session.user.id)
          .populate('friends', 'name email image')
          .select('friends')
          .lean(),
        FriendRequest.find({
          to: session.user.id,
          status: 'PENDING'
        })
          .populate('from', 'name email image')
          .select('from to status createdAt updatedAt')
          .lean()
      ]);
    },
    30 // Cache for 30 seconds
  );

  if (!user) {
    redirect('/login');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const friends = (user as any).friends || [];

  return (
    <div className="max-w-4xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Friends</h1>
        <p className="text-muted-foreground">Connect with others and track progress together.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* Recent Activity or Friends Grid */}
          <section>
            <h2 className="text-xl font-bold mb-4">Your Friends ({friends.length})</h2>
            {friends.length === 0 ? (
              <div className="p-8 text-center border rounded-2xl bg-muted/20">
                <p className="text-muted-foreground">You haven&apos;t added any friends yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {friends.map((friend: any) => (
                  <div key={friend._id.toString()} className="glass-card p-4 rounded-xl flex items-center justify-between group hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                        {friend.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold">{friend.name}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[120px]">{friend.email}</div>
                      </div>
                    </div>
                    <Link href={`/profile/${friend._id.toString()}`} className="text-xs font-bold text-primary opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      View Profile →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <AddFriend />

          {pendingRequests.length > 0 && (
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                Requests <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
              </h3>
              <div className="space-y-3">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {pendingRequests.map((req: any) => (
                  <FriendRequestItem
                    key={req._id.toString()}
                    request={{
                      ...req,
                      _id: req._id.toString(),
                      to: req.to.toString(),
                      from: {
                        ...req.from,
                        _id: req.from._id.toString()
                      },
                      createdAt: req.createdAt ? req.createdAt.toISOString() : undefined,
                      updatedAt: req.updatedAt ? req.updatedAt.toISOString() : undefined
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
