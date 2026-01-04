const mongoose = require('mongoose');
const crypto = require('crypto');

const urlToken = '049145f3669e4268a6da3afbe412f589a8a3f51a37d58ebb29e0d9fd66481464';
const expectedHash = crypto.createHash('sha256').update(urlToken).digest('hex');

async function checkDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://kaviuln:kaviuln@ulab-app.ekgrocw.mongodb.net/?appName=ULAB-App';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected!');
    
    // Access the User collection directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    const user = await usersCollection.findOne({ email: 'kavnij@gmail.com' });
    
    if (!user) {
      console.log('\nERROR: User not found with email: kavnij@gmail.com');
    } else {
      console.log('\n=== User Found ===');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Has reset token:', !!user.passwordResetToken);
      
      if (user.passwordResetToken) {
        console.log('\n=== Token Analysis ===');
        console.log('Stored token hash:', user.passwordResetToken);
        console.log('Expected hash:', expectedHash);
        console.log('Match?:', user.passwordResetToken === expectedHash);
        console.log('\nToken expiry:', user.passwordResetTokenExpiry);
        console.log('Current time:', new Date());
        if (user.passwordResetTokenExpiry) {
          console.log('Expired?:', user.passwordResetTokenExpiry < new Date());
        }
      } else {
        console.log('\nNo reset token found in database!');
        console.log('The forgot-password request may have failed.');
      }
    }
    
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
