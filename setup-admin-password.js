#!/usr/bin/env node

/**
 * Admin Password Setup Script
 * 
 * This script initializes the admin password in the database.
 * Run this once during initial setup.
 * 
 * Usage:
 *   node setup-admin-password.js
 * 
 * Or via npm:
 *   npm run setup:admin
 */

const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

async function main() {
  try {
    console.log('\n🔐 Admin Password Setup\n');
    console.log('This script will initialize the admin password in the database.');
    console.log('This is required for admin portal access.\n');

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const mongodbUri = process.env.MONGODB_URI;
    
    if (!mongodbUri) {
      console.error('❌ Error: MONGODB_URI not found in .env.local');
      process.exit(1);
    }

    await mongoose.connect(mongodbUri);
    console.log('✅ Connected to MongoDB\n');

    // Check if AdminSettings collection already exists
    const AdminSettings = require('./models/AdminSettings').default;
    const existingSettings = await AdminSettings.findOne();

    if (existingSettings) {
      console.log('⚠️  Admin password already initialized.');
      const update = await question('Do you want to update it? (yes/no): ');
      
      if (update.toLowerCase() !== 'yes' && update.toLowerCase() !== 'y') {
        console.log('\nℹ️  Setup cancelled.');
        await mongoose.disconnect();
        process.exit(0);
      }

      // Ask for current password
      const currentPassword = await question('Enter current admin password: ');
      const isValid = await bcrypt.compare(currentPassword, existingSettings.passwordHash);
      
      if (!isValid) {
        console.error('\n❌ Error: Current password is incorrect.');
        await mongoose.disconnect();
        process.exit(1);
      }
    }

    // Get new password
    const newPassword = await question('\nEnter new admin password (min 6 characters): ');
    
    if (newPassword.length < 6) {
      console.error('\n❌ Error: Password must be at least 6 characters.');
      await mongoose.disconnect();
      process.exit(1);
    }

    const confirmPassword = await question('Confirm password: ');
    
    if (newPassword !== confirmPassword) {
      console.error('\n❌ Error: Passwords do not match.');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Hash password
    console.log('\nHashing password...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Save to database
    if (existingSettings) {
      existingSettings.passwordHash = hashedPassword;
      await existingSettings.save();
      console.log('✅ Admin password updated successfully!\n');
    } else {
      const AdminSettings = require('./models/AdminSettings').default;
      await AdminSettings.create({
        passwordHash: hashedPassword,
      });
      console.log('✅ Admin password initialized successfully!\n');
    }

    console.log('📝 Next steps:');
    console.log('1. Remove NEXT_PUBLIC_ADMIN_PASSWORD from .env.local (if it exists)');
    console.log('2. Restart the application');
    console.log('3. Log in to the dashboard and use the new password for admin access\n');

    await mongoose.disconnect();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
