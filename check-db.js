const mongoose = require('mongoose');
const crypto = require('crypto');

// Read from environment variables instead of hardcoding
const urlToken = process.env.TEST_URL_TOKEN || '';
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error('Error: MONGODB_URI environment variable is not set');
  process.exit(1);
}

if (!urlToken) {
  console.warn('Warning: TEST_URL_TOKEN environment variable is not set. Token validation will be skipped.');
}

const expectedHash = urlToken ? crypto.createHash('sha256').update(urlToken).digest('hex') : null;

async function checkDatabase() {
  try {
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
        
        if (expectedHash) {
          console.log('Expected hash:', expectedHash);
          console.log('Match?:', user.passwordResetToken === expectedHash);
        } else {
          console.log('Expected hash: [Not provided - set TEST_URL_TOKEN env var to verify]');
        }
        
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
