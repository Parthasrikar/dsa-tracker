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

type State = { error?: string; success?: boolean } | null;

export async function sendFriendRequest(prevState: State, formData: FormData): Promise<State> {
  try {
    const user = await getUser();
    await dbConnect();

    const emailOrUsername = formData.get('email') as string;
    if (!emailOrUsername) {
      return { error: 'Email or username is required' };
    }

    // Find target user by email or username
    const targetUser = await User.findOne({
      $or: [
        { email: emailOrUsername },
        { username: emailOrUsername }
      ]
    });

    if (!targetUser) {
      return { error: 'User not found' };
    }

    const targetUserId = targetUser._id.toString();

    if (user.id === targetUserId) {
      return { error: "Cannot send friend request to yourself" };
    }

    // Check if already friends
    const currentUser = await User.findById(user.id);
    if (currentUser?.friends.includes(targetUserId as any)) {
      return { error: "Already friends" };
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
      return { error: "Request already pending" };
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
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { error: error instanceof Error ? error.message : 'Failed to send friend request' };
  }
}

// Helper function for programmatic calls (e.g., from button clicks)
export async function sendFriendRequestById(targetUserId: string) {
  try {
    const user = await getUser();
    await dbConnect();

    if (user.id === targetUserId) {
      return { success: false, error: "Cannot send friend request to yourself" };
    }

    // Check if already friends
    const currentUser = await User.findById(user.id);
    if (currentUser?.friends.includes(targetUserId as any)) {
      return { success: false, error: "Already friends" };
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
      return { success: false, error: "Request already pending" };
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
  } catch (error) {
    console.error('Error sending friend request:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send friend request' };
  }
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
