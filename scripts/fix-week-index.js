import { connect, connection } from 'mongoose';

async function fixWeekIndex() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-tracker';
    await connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = connection.db;
    const weeksCollection = db.collection('weeks');

    // Get all existing indexes
    const indexes = await weeksCollection.indexes();
    console.log('\nCurrent indexes on weeks collection:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Drop the old weekNumber_1 index if it exists
    try {
      await weeksCollection.dropIndex('weekNumber_1');
      console.log('\n✓ Dropped old weekNumber_1 index');
    } catch (err) {
      if (err.code === 27 || err.message.includes('index not found')) {
        console.log('\n✓ weekNumber_1 index does not exist (already removed or never created)');
      } else {
        throw err;
      }
    }

    // Ensure the compound index exists
    await weeksCollection.createIndex(
      { userId: 1, weekNumber: 1 },
      { unique: true, name: 'userId_1_weekNumber_1' }
    );
    console.log('✓ Ensured compound index userId_1_weekNumber_1 exists');

    // Show final indexes
    const finalIndexes = await weeksCollection.indexes();
    console.log('\nFinal indexes on weeks collection:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    console.log('\n✅ Index migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing week index:', error);
    process.exit(1);
  } finally {
    await connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixWeekIndex();
