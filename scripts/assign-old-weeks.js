import mongoose from 'mongoose';

async function assignOldWeeks() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-tracker';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const weeksCollection = db.collection('weeks');
    const daysCollection = db.collection('days');
    const usersCollection = db.collection('users');

    // Find the first user (partha srikar)
    const firstUser = await usersCollection.findOne({});
    if (!firstUser) {
      console.log('No users found in database');
      return;
    }

    console.log(`\nAssigning old data to user: ${firstUser.name} (${firstUser._id})`);

    // Find weeks without userId
    const weeksWithoutUser = await weeksCollection.find({ userId: { $exists: false } }).toArray();
    console.log(`\nFound ${weeksWithoutUser.length} weeks without userId`);

    if (weeksWithoutUser.length > 0) {
      const weekResult = await weeksCollection.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: firstUser._id } }
      );
      console.log(`✓ Updated ${weekResult.modifiedCount} weeks`);
    }

    // Find days without userId
    const daysWithoutUser = await daysCollection.find({ userId: { $exists: false } }).toArray();
    console.log(`\nFound ${daysWithoutUser.length} days without userId`);

    if (daysWithoutUser.length > 0) {
      const dayResult = await daysCollection.updateMany(
        { userId: { $exists: false } },
        { $set: { userId: firstUser._id } }
      );
      console.log(`✓ Updated ${dayResult.modifiedCount} days`);
    }

    // Verify the updates
    const totalWeeks = await weeksCollection.countDocuments({ userId: firstUser._id });
    const totalDays = await daysCollection.countDocuments({ userId: firstUser._id });
    
    console.log(`\n✅ Migration completed!`);
    console.log(`User "${firstUser.name}" now has:`);
    console.log(`  - ${totalWeeks} weeks`);
    console.log(`  - ${totalDays} days`);

  } catch (error) {
    console.error('❌ Error assigning old weeks:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

assignOldWeeks();
