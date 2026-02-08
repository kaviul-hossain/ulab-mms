#!/usr/bin/env node
/**
 * Drop problematic capstone group indexes
 * Run: MONGODB_URI="your_uri" node fix-indexes.js
 */

const mongoose = require('mongoose');

async function fixIndexes() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    
    const db = mongoose.connection.db;
    const collection = db.collection('capstonegroups');
    
    console.log('\n📋 Current indexes:');
    const indexes = await collection.getIndexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop problematic indexes
    const indexesToDrop = ['course_1_groupNumber_1', 'courseId_1_groupNumber_1'];
    
    for (const indexName of indexesToDrop) {
      try {
        await collection.dropIndex(indexName);
        console.log(`✅ Dropped index: ${indexName}`);
      } catch (e) {
        if (e.message.includes('index not found')) {
          console.log(`ℹ️  Index not found: ${indexName} (OK)`);
        } else {
          console.warn(`⚠️  Error dropping ${indexName}:`, e.message);
        }
      }
    }

    console.log('\n📋 Indexes after cleanup:');
    const newIndexes = await collection.getIndexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log('\n✅ Indexes fixed! Mongoose will recreate correct indexes on next run.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

fixIndexes();
