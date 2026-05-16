// Migration: normalize CapstoneGroup.semester to reference Semester _id
// Deletes capstone groups with no semester value

const mongoose = require('mongoose');

function normalize(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) {
    console.error('Please set MONGODB_URI environment variable (e.g. mongodb+srv://...).');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const SemesterSchema = new mongoose.Schema({
    name: String,
    description: String,
  }, { timestamps: true });

  const CapstoneGroupSchema = new mongoose.Schema({
    courseId: mongoose.Schema.Types.ObjectId,
    groupName: String,
    semester: String,
    studentIds: [mongoose.Schema.Types.ObjectId],
    supervisorId: mongoose.Schema.Types.ObjectId,
  }, { timestamps: true });

  const Semester = mongoose.model('Semester', SemesterSchema, 'semesters');
  const CapstoneGroup = mongoose.model('CapstoneGroup', CapstoneGroupSchema, 'capstonegroups');

  const semesters = await Semester.find().lean();
  const semMap = new Map();
  semesters.forEach(s => {
    semMap.set(normalize(s.name), s);
    semMap.set(normalize((s.description || '')), s);
    // also map the _id string
    semMap.set(String(s._id), s);
  });

  console.log(`Loaded ${semesters.length} semesters`);

  const groups = await CapstoneGroup.find().lean();
  console.log(`Found ${groups.length} capstone groups`);

  let deleted = 0;
  let updated = 0;
  let unmatched = 0;
  const unmatchedExamples = [];

  for (const g of groups) {
    const sem = g.semester;
    if (!sem || (typeof sem === 'string' && sem.trim() === '')) {
      // delete group
      await CapstoneGroup.deleteOne({ _id: g._id });
      deleted++;
      continue;
    }

    // If sem is an ObjectId string and matches a semester _id, keep as is (but ensure string type)
    if (/^[0-9a-fA-F]{24}$/.test(String(sem))) {
      // already an id -- verify it exists in semesters
      const found = semesters.find(s => String(s._id) === String(sem));
      if (found) {
        // ensure stored as string of _id
        await CapstoneGroup.updateOne({ _id: g._id }, { $set: { semester: String(found._id) } });
        updated++;
      } else {
        // object id not found among semesters
        unmatched++;
        if (unmatchedExamples.length < 5) unmatchedExamples.push({ id: g._id, semester: sem });
      }
      continue;
    }

    // Try to match by normalized name/description
    const key = normalize(sem);
    const match = semMap.get(key);
    if (match) {
      await CapstoneGroup.updateOne({ _id: g._id }, { $set: { semester: String(match._id) } });
      updated++;
    } else {
      unmatched++;
      if (unmatchedExamples.length < 5) unmatchedExamples.push({ id: g._id, semester: sem });
    }
  }

  console.log('Migration summary:');
  console.log('  Deleted groups with empty semester:', deleted);
  console.log('  Updated groups to reference semester _id:', updated);
  console.log('  Unmatched groups left unchanged:', unmatched);
  if (unmatchedExamples.length > 0) {
    console.log('  Examples of unmatched groups:', unmatchedExamples);
  }

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
