'use server';

import dbConnect from '@/lib/db';
import { Day } from '@/models/Day';
import { Week } from '@/models/Week';
import { Problem } from '@/models/Problem';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

import { invalidateCache, generateCacheKey } from '@/lib/cache';

async function getUser() {
  const session = await getSession();
  if (!session || !session.user || !session.user.id) {
    throw new Error('Unauthorized');
  }
  return session.user;
}

export async function toggleDayCompletion(dayId: string, newState: boolean) {
  const user = await getUser();
  await dbConnect();

  // Find which week this day belongs to for cache invalidation
  const day = await Day.findById(dayId).select('weekNumber').lean();

  await Day.findOneAndUpdate({ _id: dayId, userId: user.id }, { isCompleted: newState });

  // Invalidate caches
  await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invalidateCache(generateCacheKey('week', (day as any)?.weekNumber, user.id)),
    invalidateCache(generateCacheKey('dashboard', user.id)),
    invalidateCache(generateCacheKey('insights', user.id)), // Consistency changes
    invalidateCache(generateCacheKey('friends', 'page', user.id)) // Self in friends list might change stats? Actually stats are aggregating Day.
  ]);

  revalidatePath('/');
  revalidatePath('/week/[id]', 'page');
}

export async function updateDayContent(dayId: string, data: { notes?: string; plan?: string }) {
  const user = await getUser();
  await dbConnect();
  await Day.findOneAndUpdate({ _id: dayId, userId: user.id }, data);
  revalidatePath('/week/[id]', 'page');
}

export async function updateWeekGoal(weekId: string, goals: string) {
  const user = await getUser();
  await dbConnect();
  await Week.findOneAndUpdate({ _id: weekId, userId: user.id }, { goals });
  revalidatePath('/week/[id]', 'page');
}

export async function updateWeekReflection(weekId: string, data: { reflection: string; satisfaction: number }) {
  const user = await getUser();
  await dbConnect();
  await Week.findOneAndUpdate({ _id: weekId, userId: user.id }, data);
  revalidatePath('/week/[id]', 'page');
}

type ProblemData = {
  title: string;
  link?: string;
  notes?: string;
  difficulty?: string;
  weekNumber: number;
  status: string;
  dayId?: string;
  tags?: string[];
  rating?: number;
};

export async function addProblem(data: ProblemData) {
  const user = await getUser();
  await dbConnect();
  await Problem.create({ ...data, userId: user.id });

  // Invalidate caches
  await Promise.all([
    invalidateCache(generateCacheKey('week', data.weekNumber, user.id)),
    invalidateCache(generateCacheKey('problems', user.id)),
    invalidateCache(generateCacheKey('dashboard', user.id)),
    invalidateCache(generateCacheKey('insights', user.id))
  ]);

  revalidatePath('/problems');
  revalidatePath('/week/[id]', 'page');
}

export async function updateProblemStatus(id: string, status: string) {
  const user = await getUser();
  await dbConnect();
  const problem = await Problem.findOneAndUpdate({ _id: id, userId: user.id }, { status }, { new: true }).lean();

  if (problem) {
    await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      invalidateCache(generateCacheKey('week', (problem as any).weekNumber, user.id)),
      invalidateCache(generateCacheKey('problems', user.id)),
      invalidateCache(generateCacheKey('dashboard', user.id)),
      invalidateCache(generateCacheKey('insights', user.id))
    ]);
  }

  revalidatePath('/problems');
}

export async function deleteProblem(id: string) {
  const user = await getUser();
  await dbConnect();
  await Problem.findOneAndDelete({ _id: id, userId: user.id });
  revalidatePath('/problems');
  revalidatePath('/week/[id]', 'page');
}

export async function toggleProblemStar(id: string, currentStarred: boolean) {
  const user = await getUser();
  await dbConnect();
  const newStarred = !currentStarred;
  await Problem.findOneAndUpdate({ _id: id, userId: user.id }, { starred: newStarred });
  revalidatePath('/problems');
  revalidatePath('/week/[id]', 'page');
  revalidatePath('/insights');
}

export async function updateProblemTags(id: string, tags: string[], rating?: number) {
  const user = await getUser();
  await dbConnect();
  const updateData: { tags: string[]; rating?: number } = { tags };
  if (rating !== undefined && rating > 0) {
    updateData.rating = rating;
  }
  await Problem.findOneAndUpdate(
    { _id: id, userId: user.id },
    { $set: updateData },
    { new: true, runValidators: true }
  );
  revalidatePath('/problems');
  revalidatePath('/week/[id]', 'page');
  revalidatePath('/insights');
}

export async function updateProblemNotes(id: string, notes: string) {
  const user = await getUser();
  await dbConnect();
  await Problem.findOneAndUpdate({ _id: id, userId: user.id }, { notes });
  revalidatePath('/problems');
  revalidatePath('/week/[id]', 'page');
}

export async function updateProgramConfig(startDate: string, totalWeeks: number) {
  const user = await getUser();
  await dbConnect();

  // Import models
  const { User } = await import('@/models/User');
  const { Week } = await import('@/models/Week');
  const { Day } = await import('@/models/Day');

  // Check existing weeks count
  const existingWeeksCount = await Week.countDocuments({ userId: user.id });

  // Prevent reducing weeks if data already exists
  if (totalWeeks < existingWeeksCount) {
    throw new Error(`Cannot reduce weeks to ${totalWeeks}. You already have ${existingWeeksCount} weeks with data. You can only increase the total weeks.`);
  }

  const newStartDate = new Date(startDate);

  // Update user config
  await User.findByIdAndUpdate(user.id, {
    programConfig: {
      startDate: newStartDate,
      totalWeeks
    }
  });

  // 1. Update EXISTING weeks and days to align with the new start date
  const existingWeeks = await Week.find({ userId: user.id }).sort({ weekNumber: 1 });

  // Calculate the time difference (offset)
  const oldStartDate = existingWeeks.length > 0 ? new Date(existingWeeks[0].startDate) : new Date();
  const timeDiff = newStartDate.getTime() - oldStartDate.getTime();

  if (timeDiff === 0 && totalWeeks === existingWeeksCount) {
    return; // No changes needed
  }

  // Bulk operations
  const weekUpdates = [];
  const dayUpdates = [];

  // Prepare Week Updates
  for (const week of existingWeeks) {
    const newWeekStart = new Date(new Date(week.startDate).getTime() + timeDiff);
    weekUpdates.push({
      updateOne: {
        filter: { _id: week._id },
        update: { startDate: newWeekStart }
      }
    });
  }

  // Prepare Day Updates
  const existingDays = await Day.find({ userId: user.id });

  for (const day of existingDays) {
    const newDayDate = new Date(new Date(day.date).getTime() + timeDiff);
    dayUpdates.push({
      updateOne: {
        filter: { _id: day._id },
        update: { date: newDayDate }
      },
      // Store original date for sorting to avoid collisions
      originalDate: day.date
    });
  }

  // Sort day updates to avoid unique index collisions
  // If moving forward (+timeDiff), update latest days first (descending) so we don't bump into existing future dates
  // If moving backward (-timeDiff), update earliest days first (ascending) so we don't bump into existing past dates
  // WAIT: If we shift +1 week. Day 1 goes to Day 8. Day 8 exists. Collision. So day 8 must move to Day 15 FIRST.
  // So: +Diff -> Descending Sort. -Diff -> Ascending Sort.

  if (timeDiff > 0) {
    dayUpdates.sort((a, b) => new Date(b.originalDate).getTime() - new Date(a.originalDate).getTime());
  } else {
    dayUpdates.sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime());
  }

  // Clean up the helper property before sending to Mongo
  const finalDayUpdates = dayUpdates.map(({ updateOne }) => ({ updateOne }));

  if (weekUpdates.length > 0) await Week.bulkWrite(weekUpdates);
  if (finalDayUpdates.length > 0) await Day.bulkWrite(finalDayUpdates);


  // 2. Create NEW weeks if totalWeeks increased
  if (totalWeeks > existingWeeksCount) {
    const weeksToAdd = totalWeeks - existingWeeksCount;
    // We can use the newStartDate directly as base

    const newWeeks = [];
    for (let i = 0; i < weeksToAdd; i++) {
      const weekNum = existingWeeksCount + i + 1;
      const weekStart = new Date(newStartDate);
      weekStart.setDate(weekStart.getDate() + (weekNum - 1) * 7);

      newWeeks.push({
        weekNumber: weekNum,
        startDate: weekStart,
        userId: user.id
      });
    }

    // Insert new weeks
    await Week.insertMany(newWeeks);

    // Create days for new weeks
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const newDays = [];
    for (const week of newWeeks) {
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayDate = new Date(week.startDate);
        dayDate.setDate(dayDate.getDate() + dayIndex);

        newDays.push({
          date: dayDate,
          dayName: dayNames[dayIndex],
          weekNumber: week.weekNumber,
          isCompleted: false,
          userId: user.id
        });
      }
    }

    await Day.insertMany(newDays);
  }

  revalidatePath('/');
  revalidatePath('/settings');
}

export async function copyProblemToMyList(problemData: { title: string; link?: string; difficulty?: string }) {
  const user = await getUser();
  await dbConnect();

  // Find today's day entry
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayDay = await Day.findOne({
    userId: user.id,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  }).lean();

  if (!todayDay) {
    throw new Error('No day entry found for today');
  }

  // Create the problem for the current user
  await Problem.create({
    title: problemData.title,
    link: problemData.link,
    difficulty: problemData.difficulty || 'Medium',
    status: 'PENDING',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    weekNumber: (todayDay as any).weekNumber,
    dayId: todayDay._id,
    userId: user.id
  });

  revalidatePath('/problems');
  revalidatePath('/week/[id]', 'page');
  revalidatePath('/profile/[userId]', 'page');

  return { success: true };
}
