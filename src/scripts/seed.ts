
import dbConnect from '../lib/db';
import { Week } from '../models/Week';
import { Day } from '../models/Day';
import { startOfWeek, addWeeks, addDays, format } from 'date-fns';

async function seed() {
  await dbConnect();

  console.log('Connected to DB. Clearing old data...');
  await Week.deleteMany({});
  await Day.deleteMany({});

  const today = new Date();
  // Start from the most recent Monday
  const startDate = startOfWeek(today, { weekStartsOn: 1 });

  console.log(`Starting 16-week journey from: ${startDate.toDateString()}`);

  const weeks = [];
  const days = [];

  for (let i = 0; i < 16; i++) {
    const weekStart = addWeeks(startDate, i);
    const weekNum = i + 1;

    weeks.push({
      weekNumber: weekNum,
      startDate: weekStart,
      goals: '',
      satisfaction: null,
      reflection: '',
    });

    for (let j = 0; j < 7; j++) {
      const dayDate = addDays(weekStart, j);
      days.push({
        weekNumber: weekNum,
        dayName: format(dayDate, 'EEE'), // Mon, Tue...
        date: dayDate,
        isCompleted: false,
        notes: '',
        plan: '',
      });
    }
  }

  await Week.insertMany(weeks);
  await Day.insertMany(days);

  console.log(`Seeded 16 weeks and ${days.length} days.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
