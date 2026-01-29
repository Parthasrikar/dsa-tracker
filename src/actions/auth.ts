'use server';

import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import { User } from '@/models/User';
import { login as setSession, logout as deleteSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter both email and password' };
  }

  await dbConnect();

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return { error: 'Invalid email or password' };
    }

    if (!user.password) {
      return { error: 'Invalid email or password' };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return { error: 'Invalid email or password' };
    }

    // Create session
    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      image: user.image
    };

    await setSession(userData);
  } catch (err) {
    console.error('Login error:', err);
    return { error: 'Something went wrong during login' };
  }

  redirect('/');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function signup(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const username = formData.get('username') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const startDateStr = formData.get('startDate') as string;

  if (!name || !username || !email || !password || !startDateStr) {
    return { error: 'Please provide all required fields' };
  }

  // Validate username format
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { error: 'Username can only contain letters, numbers, and underscores' };
  }

  // Basic validation
  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' };
  }

  await dbConnect();

  try {
    // Check if email or username already exists
    const existingUser = await User.findOne({
      $or: [
        { email },
        { username: username.toLowerCase() }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return { error: 'Email already registered' };
      }
      if (existingUser.username === username.toLowerCase()) {
        return { error: 'Username already taken' };
      }
    }

    // Parse start date from input (YYYY-MM-DD -> Local Date at midnight)
    const [y, m, d] = startDateStr.split('-').map(Number);
    const userStartDate = new Date(y, m - 1, d);
    userStartDate.setHours(0, 0, 0, 0);

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      username: username.toLowerCase(),
      email,
      password: hashedPassword,
      friends: [],
      programConfig: {
        startDate: userStartDate,
        totalWeeks: 12
      }
    });

    // Generate initial weeks
    // Start from the Monday of the week containing the start date
    const day = userStartDate.getDay();
    const diff = userStartDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const programStart = new Date(userStartDate);
    programStart.setDate(diff); // This correctly adjusts the date object to the Monday
    programStart.setHours(0, 0, 0, 0);

    // Dynamic import to avoid circular dep issues if any, though unlikely here
    const { Week } = await import('@/models/Week');
    const { Day } = await import('@/models/Day');

    const weeksToCreate = [];
    const daysToCreate = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 1; i <= 12; i++) {
      const weekStart = new Date(programStart);
      weekStart.setDate(programStart.getDate() + (i - 1) * 7);

      weeksToCreate.push({
        weekNumber: i,
        startDate: weekStart,
        userId: newUser._id
      });

      for (let j = 0; j < 7; j++) {
        const currentDay = new Date(weekStart);
        currentDay.setDate(weekStart.getDate() + j);
        currentDay.setHours(0, 0, 0, 0);

        // Only create days that are on or after the user's start date
        if (currentDay.getTime() >= userStartDate.getTime()) {
          daysToCreate.push({
            weekNumber: i,
            dayName: dayNames[j],
            date: currentDay,
            userId: newUser._id,
            isCompleted: false
          });
        }
      }
    }

    await Week.insertMany(weeksToCreate);
    await Day.insertMany(daysToCreate);

    // Login immediately after signup
    const userData = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
      image: newUser.image
    };

    await setSession(userData);
  } catch (err) {
    console.error('Signup error:', err);
    return { error: 'Something went wrong during registration' };
  }

  redirect('/');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
