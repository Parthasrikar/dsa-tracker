import mongoose from 'mongoose';

async function checkWeeks() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-tracker';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const weeksCollection = db.collection('weeks');
    const usersCollection = db.collection('users');

    // Check users
    const users = await usersCollection.find({}).toArray();
    console.log(`\nTotal users: ${users.length}`);
    if (users.length > 0) {
      console.log(`First user: ${users[0].name} (ID: ${users[0]._id})`);
    }

    // Check weeks
    const weeks = await weeksCollection.find({}).toArray();
    console.log(`\nTotal weeks: ${weeks.length}`);
    
    if (weeks.length > 0) {
      console.log('\nFirst week sample:');
      console.log(JSON.stringify(weeks[0], null, 2));
      
      const weeksWithUserId = weeks.filter(w => w.userId);
      const weeksWithoutUserId = weeks.filter(w => !w.userId);
      
      console.log(`\nWeeks with userId: ${weeksWithUserId.length}`);
      console.log(`Weeks without userId: ${weeksWithoutUserId.length}`);
    } else {
      console.log('\n⚠️  No weeks found in database!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkWeeks();
