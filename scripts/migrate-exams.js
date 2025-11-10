// Migration script to update exam schema from old to new format
const mongoose = require('mongoose');

// MongoDB URI
const MONGODB_URI = '';

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI environment variable');
}

async function migrateExams() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const examsCollection = db.collection('exams');

    // Get all exams
    const exams = await examsCollection.find({}).toArray();
    console.log(`Found ${exams.length} exams to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const exam of exams) {
      const updates = {};
      let needsUpdate = false;

      // Migrate 'name' to 'displayName' if displayName doesn't exist
      if (exam.name && !exam.displayName) {
        updates.displayName = exam.name;
        needsUpdate = true;
      }

      // Remove old 'name' field
      if (exam.name !== undefined) {
        updates.$unset = { name: '' };
        needsUpdate = true;
      }

      // Remove old 'scalingValue' field
      if (exam.scalingValue !== undefined) {
        if (!updates.$unset) updates.$unset = {};
        updates.$unset.scalingValue = '';
        needsUpdate = true;
      }

      // Add weightage if doesn't exist (default to scalingValue if available, else 0)
      if (exam.weightage === undefined) {
        updates.weightage = exam.scalingValue || 0;
        needsUpdate = true;
      }

      // Add scalingEnabled if doesn't exist
      if (exam.scalingEnabled === undefined) {
        updates.scalingEnabled = false;
        needsUpdate = true;
      }

      // Add isRequired if doesn't exist
      if (exam.isRequired === undefined) {
        updates.isRequired = false;
        needsUpdate = true;
      }

      // Add examType if doesn't exist
      if (exam.examType === undefined) {
        // Try to infer from name
        const name = (exam.displayName || exam.name || '').toLowerCase();
        if (name.includes('mid')) {
          updates.examType = 'midterm';
        } else if (name.includes('final')) {
          updates.examType = 'final';
        } else {
          updates.examType = 'custom';
        }
        needsUpdate = true;
      }

      if (needsUpdate) {
        const updateDoc = updates.$unset ? { $set: updates, $unset: updates.$unset } : { $set: updates };
        if (updates.$unset) {
          delete updateDoc.$set.$unset;
        }

        await examsCollection.updateOne(
          { _id: exam._id },
          updateDoc
        );
        migratedCount++;
        console.log(`✓ Migrated exam: ${exam.displayName || exam.name || exam._id}`);
      } else {
        skippedCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateExams();
