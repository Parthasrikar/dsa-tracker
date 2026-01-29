'use server';

import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { FriendRequest } from '@/models/FriendRequest';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getUser() {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendFriendRequest(prevState: any, formData: FormData) {
  const searchTerm = formData.get('email') as string;

  const currentUser = await getUser();
  await dbConnect();

  // Search by email or username
  const targetUser = await User.findOne({ 
    $or: [
      { email: searchTerm },
      { username: searchTerm.toLowerCase() }
    ]
  });
  
  if (!targetUser) {
    return { error: 'User not found' };
  }

  if (targetUser._id.toString() === currentUser.id) {
    return { error: 'Cannot add yourself' };
  }

  const sender = await User.findById(currentUser.id);
  if (!sender) {
    return { error: 'User not found' };
  }
  if (sender.friends.includes(targetUser._id)) {
    return { error: 'Already friends' };
  }

  // Check for existing request
  const existingRequest = await FriendRequest.findOne({
    $or: [
      { from: currentUser.id, to: targetUser._id },
      { from: targetUser._id, to: currentUser.id }
    ],
    status: 'PENDING'
  });

  if (existingRequest) {
    return { error: 'Friend request already pending' };
  }

  await FriendRequest.create({
    from: currentUser.id,
    to: targetUser._id,
    status: 'PENDING'
  });

  revalidatePath('/friends');
  return { success: true };
}

export async function respondToFriendRequest(requestId: string, action: 'ACCEPT' | 'REJECT') {
  const currentUser = await getUser();
  await dbConnect();

  const request = await FriendRequest.findById(requestId);
  if (!request) {
    return { error: 'Request not found' };
  }

  if (request.to.toString() !== currentUser.id) {
    return { error: 'Unauthorized' };
  }

  if (request.status !== 'PENDING') {
    return { error: 'Request already handled' };
  }

  if (action === 'REJECT') {
    request.status = 'REJECTED';
    await request.save();
  } else {
    request.status = 'ACCEPTED';
    await request.save();

    // Add to friends lists
    await User.findByIdAndUpdate(request.from, { $addToSet: { friends: request.to } });
    await User.findByIdAndUpdate(request.to, { $addToSet: { friends: request.from } });
  }

  revalidatePath('/friends');
  return { success: true };
}

export async function removeFriend(friendId: string) {
  const currentUser = await getUser();
  await dbConnect();

  await User.findByIdAndUpdate(currentUser.id, { $pull: { friends: friendId } });
  await User.findByIdAndUpdate(friendId, { $pull: { friends: currentUser.id } });

  // Also verify if there are any Accepted requests and maybe clean them up or leave them as history
  // Typically we can leave them or update status, but strictly removing from friends array is enough for logic.

  revalidatePath('/friends');
  return { success: true };
}
