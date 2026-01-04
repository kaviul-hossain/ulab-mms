const crypto = require('crypto');

const urlToken = '049145f3669e4268a6da3afbe412f589a8a3f51a37d58ebb29e0d9fd66481464';
const expectedHash = crypto.createHash('sha256').update(urlToken).digest('hex');

console.log('Token from URL:', urlToken);
console.log('Expected hash in DB:', expectedHash);
console.log('');
console.log('This hash should match what is stored in:');
console.log('db.users.findOne({email: "kavnij@gmail.com"}).passwordResetToken');
