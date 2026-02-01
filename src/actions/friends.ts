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
    if (!emailOrUsername || typeof emailOrUsername !== 'string') {
      return { error: 'Email or username is required' };
    }

    // Find target user by email or username
    const targetUser = await User.findOne({
      $or: [
        { email: emailOrUsername.trim() },
        { username: emailOrUsername.trim() }
      ]
    }).lean();

    if (!targetUser) {
      return { error: 'User not found' };
    }

    const targetUserId = targetUser._id.toString();

    if (user.id === targetUserId) {
      return { error: "Cannot send friend request to yourself" };
    }

    // Check if already friends with better error handling
    const currentUser = await User.findById(user.id).lean();
    if (!currentUser) {
      return { error: "User not found" };
    }

    // Safely check friends array
    const friendsArray = currentUser.friends || [];
    const isFriend = friendsArray.some((friendId: any) =>
      friendId.toString() === targetUserId
    );

    if (isFriend) {
      return { error: "Already friends" };
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: user.id, to: targetUserId },
        { from: targetUserId, to: user.id }
      ],
      status: 'PENDING'
    }).lean();

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

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return { error: 'Please log in to send friend requests' };
      }
      if (error.message.includes('validation')) {
        return { error: 'Invalid input. Please check your entry.' };
      }
    }

    return { error: 'Failed to send friend request. Please try again.' };
  }
}

// Helper function for programmatic calls (e.g., from button clicks)
export async function sendFriendRequestById(targetUserId: string) {
  try {
    // Validate input
    if (!targetUserId || typeof targetUserId !== 'string') {
      return { success: false, error: "Invalid user ID" };
    }

    const user = await getUser();
    await dbConnect();

    if (user.id === targetUserId) {
      return { success: false, error: "Cannot send friend request to yourself" };
    }

    // Check if already friends with better error handling
    const currentUser = await User.findById(user.id).lean();
    if (!currentUser) {
      return { success: false, error: "User not found" };
    }

    // Safely check friends array
    const friendsArray = currentUser.friends || [];
    const isFriend = friendsArray.some((friendId: any) =>
      friendId.toString() === targetUserId
    );

    if (isFriend) {
      return { success: false, error: "Already friends" };
    }

    // Check if request already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { from: user.id, to: targetUserId },
        { from: targetUserId, to: user.id }
      ],
      status: 'PENDING'
    }).lean();

    if (existingRequest) {
      return { success: false, error: "Request already pending" };
    }

    // Verify target user exists
    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      return { success: false, error: "Target user not found" };
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

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Cast to ObjectId failed')) {
        return { success: false, error: 'Invalid user ID format' };
      }
      if (error.message.includes('Unauthorized')) {
        return { success: false, error: 'Please log in to send friend requests' };
      }
    }

    return { success: false, error: 'Failed to send friend request. Please try again.' };
  }
}

export async function respondToFriendRequest(requestId: string, action: 'ACCEPT' | 'REJECT') {
  try {
    // Validate input
    if (!requestId || typeof requestId !== 'string') {
      throw new Error('Invalid request ID');
    }

    if (action !== 'ACCEPT' && action !== 'REJECT') {
      throw new Error('Invalid action');
    }

    const user = await getUser();
    await dbConnect();

    const request = await FriendRequest.findById(requestId).lean();
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

      // Add to friends lists with error handling
      try {
        await User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } });
        await User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } });
      } catch (updateError) {
        console.error('Error updating friend lists:', updateError);
        // Rollback the request status update
        await FriendRequest.findByIdAndUpdate(requestId, { status: 'PENDING' });
        throw new Error('Failed to update friend lists');
      }

      // Clean up request
      await FriendRequest.findByIdAndDelete(requestId);

      // Invalidate caches
      try {
        await Promise.all([
          invalidateCache(generateCacheKey('leaderboard', 'friends', user.id)),
          invalidateCache(generateCacheKey('leaderboard', 'friends', request.from.toString())),
          invalidateCache(generateCacheKey('friends', 'page', user.id)),
          invalidateCache(generateCacheKey('friends', 'page', request.from.toString()))
        ]);
      } catch (cacheError) {
        // Cache invalidation failure shouldn't break the flow
        console.error('Cache invalidation error:', cacheError);
      }
    }

    revalidatePath('/friends');
    revalidatePath('/leaderboard');
    return { success: true };
  } catch (error) {
    console.error('Error responding to friend request:', error);

    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('Cast to ObjectId failed')) {
        throw new Error('Invalid request ID format');
      }
      if (error.message.includes('Unauthorized')) {
        throw new Error('You are not authorized to respond to this request');
      }
      throw error;
    }

    throw new Error('Failed to respond to friend request. Please try again.');
  }
}
