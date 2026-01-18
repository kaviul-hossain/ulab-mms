#!/usr/bin/env node

/**
 * Setup script to initialize admin password in MongoDB
 * Run with: node scripts/setup-admin-password.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Load environment variables
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envLocal = fs.readFileSync(envLocalPath, 'utf-8');
  envLocal.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const AdminSettingsSchema = new mongoose.Schema(
  {
    passwordHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const AdminSettings = mongoose.model('AdminSettings', AdminSettingsSchema);

async function setupAdminPassword(password = 'Admin@123') {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Error: MONGODB_URI not set in .env.local');
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB');

    // Check if admin settings already exist
    let adminSettings = await AdminSettings.findOne();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✓ Password hashed');

    if (adminSettings) {
      // Update existing
      adminSettings.passwordHash = hashedPassword;
      await adminSettings.save();
      console.log('✓ Admin password updated successfully!');
      console.log(`Password: ${password}`);
    } else {
      // Create new
      adminSettings = await AdminSettings.create({
        passwordHash: hashedPassword,
      });
      console.log('✓ Admin settings initialized successfully!');
      console.log(`Password: ${password}`);
    }

    await mongoose.connection.close();
    console.log('✓ Connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up admin password:', error.message);
    process.exit(1);
  }
}

// Get password from command line arguments or use default
const passwordArg = process.argv[2];
const password = passwordArg || 'Admin@123';

setupAdminPassword(password);
