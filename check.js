const mongoose = require('mongoose');
const fs = require('fs');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ulab-mms');
  const db = mongoose.connection.db;
  const exams = await db.collection('exams').find({ examCategory: 'Project' }).toArray();
  console.log('Project Exams:', exams.map(e => ({ id: e._id, name: e.displayName, totalMarks: e.totalMarks, courseId: e.courseId })));
  
  if (exams.length > 0) {
    const marks = await db.collection('marks').find({ examId: { $in: exams.map(e => e._id) } }).limit(20).toArray();
    console.log('Sample Marks:', marks);
  }
  process.exit(0);
}

run().catch(console.error);
