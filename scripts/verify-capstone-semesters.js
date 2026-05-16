// Verify counts of capstone groups per semester

const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) {
    console.error('Please set MONGODB_URI environment variable.');
    process.exit(1);
  }

  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  const Semester = mongoose.model('Semester', new mongoose.Schema({ name: String, description: String }), 'semesters');
  const CapstoneGroup = mongoose.model('CapstoneGroup', new mongoose.Schema({ semester: String }), 'capstonegroups');

  // Group by semester value
  const agg = await CapstoneGroup.aggregate([
    { $group: { _id: '$semester', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const semesters = await Semester.find().lean();
  const semMap = new Map();
  semesters.forEach(s => semMap.set(String(s._id), s.name));

  console.log('Capstone groups count by semester:');
  for (const row of agg) {
    const key = row._id || '(empty)';
    const label = semMap.get(String(key)) || key;
    console.log(`  ${label}: ${row.count}`);
  }

  await mongoose.disconnect();
  console.log('Disconnected');
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
