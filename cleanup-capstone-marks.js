/**
 * Cleanup script to remove stale Capstone Marks records without proper courseId
 * and rebuild indexes to prevent mark contamination across groups
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
let mongoUri = 'mongodb://localhost:27017/ulab-mms';

try {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const uriMatch = envContent.match(/MONGODB_URI=(.+)/);
    if (uriMatch && uriMatch[1]) {
      mongoUri = uriMatch[1].trim();
      console.log('✅ Loaded MongoDB URI from .env.local');
    }
  }
} catch (err) {
  console.warn('⚠️  Could not load .env.local, using default connection');
}

// Define CapstoneMarks schema inline to avoid ES module issues
const capstoneMarsSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    evaluatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    supervisorMarks: { type: Number, min: 0, max: 100, default: null },
    supervisorComments: { type: String, default: '' },
    evaluatorMarks: { type: Number, min: 0, max: 100, default: null },
    evaluatorComments: { type: String, default: '' },
    weeklyJournalMarks: { type: Number, min: 0, max: 10, default: null },
    weeklyJournalComments: { type: String, default: '' },
    peerMarks: { type: Number, min: 0, max: 5, default: null },
    peerComments: { type: String, default: '' },
    reportRubrics: { type: Object, default: {} },
    reportMarks: { type: Number, min: 0, max: 54, default: null },
    reportComments: { type: String, default: '' },
    finalMarks: { type: Number, default: null },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submissionType: { type: String, enum: ['supervisor', 'evaluator', 'weeklyJournal', 'peer', 'report'], required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const CapstoneMarks = mongoose.model('CapstoneMarks', capstoneMarsSchema);

async function cleanupCapstoneMarks() {
  try {
    console.log('🔵 Connecting to MongoDB...');
    console.log(`📍 Connection string: ${mongoUri.substring(0, 50)}...`);
    
    // Set connection timeout
    const connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
    });
    
    await connectionPromise;
    console.log('✅ Connected to MongoDB');

    console.log('\n📊 Fetching CapstoneMarks collection...');
    const collection = mongoose.connection.collection('capstonemarks');

    // Step 1: Find records with missing or null courseId
    console.log('\n🔍 Step 1: Finding records with missing courseId...');
    const invalidRecords = await CapstoneMarks.find({
      $or: [
        { courseId: null },
        { courseId: undefined },
        { courseId: { $exists: false } },
      ],
    });

    console.log(`📋 Found ${invalidRecords.length} records with missing courseId`);

    if (invalidRecords.length > 0) {
      console.log('\n⚠️  Records to be analyzed:');
      invalidRecords.slice(0, 5).forEach((record, idx) => {
        console.log(`${idx + 1}. Student: ${record.studentId}, Supervisor: ${record.supervisorId}, Type: ${record.submissionType}`);
      });

      if (invalidRecords.length > 5) {
        console.log(`... and ${invalidRecords.length - 5} more`);
      }

      // Step 2: Delete records with missing courseId that have stale data
      // Keep only the most recent one per student/supervisor/type combo as a fallback
      console.log('\n🗑️  Step 2: Removing duplicate/stale records with missing courseId...');
      
      // Group by studentId, supervisorId, submissionType
      const grouped = {};
      invalidRecords.forEach((record) => {
        const key = `${record.studentId}_${record.supervisorId}_${record.submissionType}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(record);
      });

      let deletedCount = 0;
      for (const key in grouped) {
        const records = grouped[key].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        // Keep the most recent, delete older ones
        for (let i = 1; i < records.length; i++) {
          await CapstoneMarks.deleteOne({ _id: records[i]._id });
          deletedCount++;
        }
      }

      console.log(`✅ Deleted ${deletedCount} stale records with missing courseId`);
    }

    // Step 3: Drop old indexes and rebuild
    console.log('\n🔧 Step 3: Rebuilding indexes with groupId support...');
    try {
      // Drop old unique index without groupId
      await collection.dropIndex('studentId_1_courseId_1_supervisorId_1_submissionType_1');
      console.log('✅ Dropped old unique index (without groupId)');
    } catch (err) {
      console.log('⚠️  Old index did not exist (this is OK)');
    }

    // Drop new sparse unique index format (in case it exists)
    try {
      await collection.dropIndex('studentId_1_courseId_1_groupId_1_supervisorId_1_submissionType_1');
      console.log('✅ Dropped any existing groupId index');
    } catch (err) {
      console.log('⚠️  GroupId index did not exist (this is OK)');
    }

    // Rebuild all indexes from the model
    await CapstoneMarks.collection.dropIndexes();
    console.log('✅ Dropped all indexes');

    // Create indexes in correct order
    await CapstoneMarks.collection.createIndex({ studentId: 1, courseId: 1, supervisorId: 1 });
    await CapstoneMarks.collection.createIndex({ supervisorId: 1, courseId: 1 });
    await CapstoneMarks.collection.createIndex({ evaluatorId: 1, courseId: 1 });
    await CapstoneMarks.collection.createIndex({ courseId: 1 });
    await CapstoneMarks.collection.createIndex({ groupId: 1, courseId: 1 });
    await CapstoneMarks.collection.createIndex(
      { studentId: 1, courseId: 1, groupId: 1, supervisorId: 1, submissionType: 1 },
      { unique: true, sparse: true }
    );
    console.log('✅ Recreated all indexes including groupId support');

    // Step 4: Summary
    console.log('\n📊 Summary:');
    const totalRecords = await CapstoneMarks.countDocuments();
    const recordsWithoutCourseId = await CapstoneMarks.countDocuments({
      $or: [
        { courseId: null },
        { courseId: undefined },
        { courseId: { $exists: false } },
      ],
    });

    console.log(`Total CapstoneMarks records: ${totalRecords}`);
    console.log(`Records still missing courseId: ${recordsWithoutCourseId}`);

    if (recordsWithoutCourseId === 0) {
      console.log('\n✨ ✅ All records are now properly associated with courses!');
      console.log('🎯 New capstone groups will start with marks = 0');
    } else {
      console.log(`\n⚠️  WARNING: ${recordsWithoutCourseId} records still missing courseId`);
    }

    console.log('\n✅ Cleanup completed successfully!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run cleanup
cleanupCapstoneMarks();
