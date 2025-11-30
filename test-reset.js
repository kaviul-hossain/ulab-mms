// Quick test script to check password reset flow
const crypto = require('crypto');

// Simulate what happens
const testEmail = 'test@example.com';
const testToken = crypto.randomBytes(32).toString('hex');
const testTokenHash = crypto.createHash('sha256').update(testToken).digest('hex');

console.log('=== Password Reset Simulation ===');
console.log('Email:', testEmail);
console.log('Plain Token:', testToken);
console.log('Token Hash:', testTokenHash);
console.log('');
console.log('When user clicks reset link:');
console.log('URL: /auth/reset-password?token=' + testToken + '&email=' + encodeURIComponent(testEmail));
console.log('');
console.log('On reset-password endpoint:');
console.log('Email received:', testEmail.toLowerCase());
console.log('Token hash from received token:', crypto.createHash('sha256').update(testToken).digest('hex'));
console.log('Match?', testTokenHash === crypto.createHash('sha256').update(testToken).digest('hex'));
