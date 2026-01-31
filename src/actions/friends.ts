'use server';

import dbConnect from '@/lib/db';
import { FriendRequest } from '@/models/FriendRequest';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { generateCacheKey, invalidateCache } from '@/lib/cache';

async function getUser() {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function sendFriendRequest(targetUserId: string) {
  const user = await getUser();
  await dbConnect();

  if (user.id === targetUserId) {
    throw new Error("Cannot send friend request to yourself");
  }

  // Check if already friends
  const currentUser = await User.findById(user.id);
  if (currentUser?.friends.includes(targetUserId as any)) {
    return { success: false, message: "Already friends" };
  }

  // Check if request already exists
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { from: user.id, to: targetUserId },
      { from: targetUserId, to: user.id }
    ],
    status: 'PENDING'
  });

  if (existingRequest) {
    return { success: false, message: "Request already pending" };
  }

  // Create friend request
  await FriendRequest.create({
    from: user.id,
    to: targetUserId,
    status: 'PENDING'
  });

  revalidatePath('/leaderboard');
  revalidatePath('/friends');
  return { success: true };
}

export async function respondToFriendRequest(requestId: string, action: 'ACCEPT' | 'REJECT') {
  const user = await getUser();
  await dbConnect();

  const request = await FriendRequest.findById(requestId);
  if (!request) {
    throw new Error('Request not found');
  }

  // Verify recipient
  if (request.to.toString() !== user.id) {
    throw new Error('Unauthorized');
  }

  if (action === 'REJECT') {
    await FriendRequest.findByIdAndDelete(requestId);
  } else {
    // Accept logic
    await FriendRequest.findByIdAndUpdate(requestId, { status: 'ACCEPTED' });

    // Add to friends lists
    await User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } });
    await User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } });

    // Clean up request
    await FriendRequest.findByIdAndDelete(requestId);

    // Invalidate caches
    await Promise.all([
      invalidateCache(generateCacheKey('leaderboard', 'friends', user.id)),
      invalidateCache(generateCacheKey('leaderboard', 'friends', request.from.toString())),
      invalidateCache(generateCacheKey('friends', 'page', user.id)),
      invalidateCache(generateCacheKey('friends', 'page', request.from.toString()))
    ]);
  }

  revalidatePath('/friends');
  revalidatePath('/leaderboard');
  return { success: true };
}
