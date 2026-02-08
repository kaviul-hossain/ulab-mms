const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';

async function dropIndex() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop the problematic index
    await db.collection('capstonegroups').dropIndex('course_1_groupNumber_1');
    console.log('✅ Dropped index: course_1_groupNumber_1');

    // Also drop any other duplicate indexes if they exist
    try {
      await db.collection('capstonegroups').dropIndex('courseId_1_groupNumber_1');
      console.log('✅ Dropped index: courseId_1_groupNumber_1');
    } catch (e) {
      console.log('Index courseId_1_groupNumber_1 not found (expected)');
    }

    console.log('\nAvailable indexes:');
    const indexes = await db.collection('capstonegroups').getIndexes();
    console.log(indexes);

    await mongoose.connection.close();
    console.log('\n✅ Done! Indexes have been reset.');
    console.log('Mongoose will recreate the sparse index on next connection.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropIndex();
