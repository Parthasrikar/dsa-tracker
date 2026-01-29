'use server';

import dbConnect from '@/lib/db';
import { Day } from '@/models/Day';
import { Week } from '@/models/Week';
import { Problem } from '@/models/Problem';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';

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
  await Day.findOneAndUpdate({ _id: dayId, userId: user.id }, { isCompleted: newState });
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
  revalidatePath('/problems');
  revalidatePath('/week/[id]', 'page');
}

export async function updateProblemStatus(id: string, status: string) {
  const user = await getUser();
  await dbConnect();
  await Problem.findOneAndUpdate({ _id: id, userId: user.id }, { status });
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

  // Update user config
  await User.findByIdAndUpdate(user.id, {
    programConfig: {
      startDate: new Date(startDate),
      totalWeeks
    }
  });

  // If increasing weeks, create the new weeks
  if (totalWeeks > existingWeeksCount) {
    const weeksToAdd = totalWeeks - existingWeeksCount;
    const start = new Date(startDate);

    // Create new weeks starting from the next week number
    const newWeeks = [];
    for (let i = 0; i < weeksToAdd; i++) {
      const weekNum = existingWeeksCount + i + 1;
      const weekStart = new Date(start);
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
