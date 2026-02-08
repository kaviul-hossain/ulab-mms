/**
 * MongoDB Index Migration
 * Drops problematic indexes and ensures correct ones exist
 */

import mongoose from 'mongoose';
import dbConnect from './mongodb';

export async function migrateIndexes() {
  try {
    await dbConnect();
    
    const db = mongoose.connection.db;
    if (!db) {
      console.warn('⚠️  Could not get MongoDB database connection');
      return;
    }

    const collection = db.collection('capstonegroups');
    
    // List of indexes to drop (old ones that cause conflicts)
    const indexesToDrop = [
      'course_1_groupNumber_1',
      'courseId_1_groupNumber_1'
    ];

    for (const indexName of indexesToDrop) {
      try {
        const indexInfo = await collection.indexExists(indexName);
        if (indexInfo) {
          await collection.dropIndex(indexName);
          console.log(`✅ Dropped conflicting index: ${indexName}`);
        }
      } catch (error: any) {
        if (!error.message.includes('index not found')) {
          console.warn(`⚠️  Could not drop index ${indexName}:`, error.message);
        }
      }
    }

    // Force Mongoose to rebuild all indexes
    const CapstoneGroup = mongoose.models.CapstoneGroup;
    if (CapstoneGroup && typeof CapstoneGroup.syncIndexes === 'function') {
      await CapstoneGroup.syncIndexes();
      console.log('✅ CapstoneGroup indexes synced');
    }

  } catch (error: any) {
    console.error('❌ Index migration error:', error.message);
  }
}
