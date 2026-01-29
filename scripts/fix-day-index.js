import { connect, connection } from 'mongoose';

async function fixDayIndex() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-tracker';
    await connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = connection.db;
    const daysCollection = db.collection('days');

    // Get all existing indexes
    const indexes = await daysCollection.indexes();
    console.log('\nCurrent indexes on days collection:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    // Drop any old single-field unique indexes that shouldn't exist
    const indexesToDrop = ['date_1', 'weekNumber_1', 'dayName_1'];
    
    for (const indexName of indexesToDrop) {
      try {
        await daysCollection.dropIndex(indexName);
        console.log(`\n✓ Dropped old ${indexName} index`);
      } catch (err) {
        if (err.code === 27 || err.message.includes('index not found')) {
          console.log(`\n✓ ${indexName} index does not exist (already removed or never created)`);
        } else {
          console.log(`\n⚠ Could not drop ${indexName}:`, err.message);
        }
      }
    }

    // Ensure the compound index exists
    await daysCollection.createIndex(
      { userId: 1, date: 1 },
      { unique: true, name: 'userId_1_date_1' }
    );
    console.log('✓ Ensured compound index userId_1_date_1 exists');

    // Show final indexes
    const finalIndexes = await daysCollection.indexes();
    console.log('\nFinal indexes on days collection:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, JSON.stringify(idx.key));
    });

    console.log('\n✅ Index migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing day index:', error);
    process.exit(1);
  } finally {
    await connection.close();
    console.log('\nDisconnected from MongoDB');
  }
}

fixDayIndex();
