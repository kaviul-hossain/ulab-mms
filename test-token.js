const crypto = require('crypto');

// Read token from environment variable instead of hardcoding
const urlToken = process.env.TEST_URL_TOKEN;

if (!urlToken) {
  console.error('Error: TEST_URL_TOKEN environment variable is not set');
  console.log('\nUsage: TEST_URL_TOKEN=your_token node test-token.js');
  process.exit(1);
}

const expectedHash = crypto.createHash('sha256').update(urlToken).digest('hex');

console.log('Token from URL:', urlToken);
console.log('Expected hash in DB:', expectedHash);
console.log('');
console.log('This hash should match what is stored in:');
console.log('db.users.findOne({email: "user@example.com"}).passwordResetToken');
