/**
 * test-token.js - Token Hash Verification Script (TEMPLATE)
 * 
 * This script helps verify password reset tokens.
 * DO NOT commit hardcoded tokens to this file.
 * 
 * Usage:
 * TEST_URL_TOKEN=your_token_here node test-token.js
 * 
 * Example:
 * TEST_URL_TOKEN=049145f3669e4268a6da3afbe412f589a8a3f51a37d58ebb29e0d9fd66481464 node test-token.js
 */

const crypto = require('crypto');

// Read token from environment variable
const urlToken = process.env.TEST_URL_TOKEN;

if (!urlToken) {
  console.error('Error: TEST_URL_TOKEN environment variable is not set');
  console.log('\nUsage: TEST_URL_TOKEN=your_token node test-token.js');
  console.log('');
  console.log('Example:');
  console.log('  TEST_URL_TOKEN=abc123def456 node test-token.js');
  process.exit(1);
}

const expectedHash = crypto.createHash('sha256').update(urlToken).digest('hex');

console.log('Token from URL:', urlToken);
console.log('Expected hash in DB:', expectedHash);
console.log('');
console.log('This hash should match what is stored in MongoDB:');
console.log('db.users.findOne({email: "user@example.com"}).passwordResetToken');
console.log('');
console.log('To verify the token matches:');
console.log('1. Get the token hash from the URL');
console.log('2. Run this script with TEST_URL_TOKEN=<token>');
console.log('3. Check if the hash matches the one in the database');
