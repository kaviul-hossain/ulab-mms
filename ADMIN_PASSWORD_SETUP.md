# Admin Portal Password Management - Database Storage

## Overview
The admin portal password is now securely stored in the MongoDB database instead of environment variables. The password is hashed using bcryptjs for security.

## Architecture

### Components Created

1. **AdminSettings Model** (`models/AdminSettings.ts`)
   - Stores the hashed admin password in MongoDB
   - Single document collection for system-wide admin settings

2. **Admin Utility** (`lib/admin.ts`)
   - `verifyAdminPassword()` - Validates password against database hash
   - Used by all API routes for admin authentication

3. **API Endpoints**
   - `/api/auth/verify-admin` - Verify admin password (used by frontend)
   - `/api/auth/admin-settings` - Initialize/update admin password (setup only)

4. **Updated API Routes**
   - `/api/files` - POST (file upload)
   - `/api/files/[id]` - DELETE (file deletion)
   - `/api/files/folders` - POST (folder creation)
   - `/api/files/folders/[folderId]` - DELETE (folder deletion)

All routes now validate admin credentials against the MongoDB database.

## Initial Setup

### Step 1: Initialize Admin Password (Already Done ✅)

The admin password has been initialized with: `Admin@123`

This was set up using the setup script:

```bash
# Setup script to initialize admin password in MongoDB
node scripts/setup-admin-password.js

# Or with custom password
node scripts/setup-admin-password.js "YourPassword"
```

The password is now securely hashed and stored in the MongoDB `adminsettings` collection.

### Step 2: Update .env.local

Remove the `NEXT_PUBLIC_ADMIN_PASSWORD` line from `.env.local` if it exists:

```env
# Remove or comment out this line:
# NEXT_PUBLIC_ADMIN_PASSWORD=Admin@123
```

The system will now use the database password instead.

## Usage

### Admin Login Flow

1. User navigates to Dashboard
2. Clicks on "Manage Resources" (Admin only)
3. Prompted to enter admin password
4. Password is sent to `/api/auth/verify-admin` endpoint
5. Backend verifies against hashed password in database
6. If valid, session token is stored in localStorage
7. Admin can now access file upload, folder creation, etc.

### File Operations

All file upload, folder creation, and deletion operations:
1. Require the admin password header (`x-admin-password`)
2. Validate the password against the database
3. Return 403 Forbidden if password is invalid

## Changing the Admin Password

### Via API

```bash
POST /api/auth/admin-settings
Content-Type: application/json

{
  "password": "NewSecurePassword@456",
  "currentPassword": "OldPassword@123"
}
```

Requirements:
- Must be authenticated (logged in)
- Must provide the current password to change it

### Via Database (Direct)

```javascript
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('NewPassword@789', 10);

db.adminsettings.updateOne({}, { $set: { passwordHash: hashedPassword } });
```

## Security Considerations

✅ **Advantages over environment variables:**
- Password not exposed in `.env.local` files
- Password can be changed without redeploying
- No accidental commits of sensitive credentials
- Centralized management in database
- Password history can be tracked if needed

✅ **Password Hashing:**
- Using bcryptjs with 10 salt rounds
- Passwords are never stored in plain text
- Cannot be reversed from the hash

✅ **Best Practices:**
- Use a strong password (minimum 6 characters, but recommend 12+ with special characters)
- Change password regularly
- Only share with trusted admins
- Audit access logs for admin operations

## Troubleshooting

### "Admin settings not configured" Error

**Solution:** Initialize the admin password using the setup script or API:
```bash
npm run setup:admin
```

### "Invalid admin password" Error

**Solution:** Verify you're using the correct password. If forgotten, reset via database directly using the MongoDB console.

### Password verification failing on all attempts

**Check:**
1. Ensure AdminSettings collection exists in MongoDB
2. Verify the password hash is stored correctly
3. Check network logs to ensure requests reach `/api/auth/verify-admin`
4. Ensure bcryptjs is properly installed: `npm install bcryptjs`

## Migration from Environment Variables

If you previously used `NEXT_PUBLIC_ADMIN_PASSWORD`:

1. Initialize the new admin password:
   ```bash
   npm run setup:admin
   ```

2. Remove from `.env.local`:
   ```env
   # Delete this line:
   # NEXT_PUBLIC_ADMIN_PASSWORD=Admin@123
   ```

3. Restart the application

4. All admin operations will now use the database password

## API Reference

### POST /api/auth/verify-admin
Verify admin password (used by frontend)

**Request:**
```json
{
  "password": "admin_password"
}
```

**Success Response (200):**
```json
{
  "message": "Admin password verified successfully"
}
```

**Error Response (401):**
```json
{
  "error": "Invalid admin password"
}
```

### POST /api/auth/admin-settings
Initialize or update admin password

**Request:**
```json
{
  "password": "new_password",
  "currentPassword": "old_password" // Only required if updating existing password
}
```

**Success Response (200):**
```json
{
  "message": "Admin password updated successfully"
}
```

### GET /api/auth/admin-settings
Check if admin password is initialized

**Success Response (200):**
```json
{
  "isInitialized": true
}
```

## Database Schema

### AdminSettings Collection
```javascript
{
  _id: ObjectId,
  passwordHash: String, // bcryptjs hash
  createdAt: ISODate,
  updatedAt: ISODate
}
```

Only one document in this collection at any time.
