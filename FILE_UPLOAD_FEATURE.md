# File Upload Feature Documentation

## Overview
This feature allows administrators to upload PDF, Excel, and Word documents. Regular users can then view and download these files from their accounts.

## Components Created

### 1. **User Model Update** (`models/User.ts`)
- Added `isAdmin: boolean` field (default: `false`)
- Tracks which users have admin privileges

### 2. **File Model** (`models/File.ts`)
- Stores file metadata and binary data
- Fields:
  - `filename`: Unique identifier (UUID-based)
  - `originalName`: Name provided by user
  - `mimeType`: File type (application/pdf, etc.)
  - `size`: File size in bytes
  - `uploadedBy`: Reference to User who uploaded
  - `fileData`: Binary file content (stored in MongoDB)
  - `uploadedAt`: Timestamp

### 3. **API Routes**

#### File Upload/List (`app/api/files/route.ts`)
- **POST** `/api/files`
  - Admin-only endpoint
  - Accepts: FormData with `file` field
  - Allowed types: PDF, Excel (.xls, .xlsx), Word (.doc, .docx)
  - Max size: 50MB
  - Returns: File ID and metadata

- **GET** `/api/files`
  - Returns list of all uploaded files
  - Available to authenticated users
  - Returns file metadata (no binary data)

#### File Download/Delete (`app/api/files/[id]/route.ts`)
- **GET** `/api/files/[id]`
  - Downloads file by ID
  - Returns binary file data with proper headers
  - Available to authenticated users

- **DELETE** `/api/files/[id]`
  - Admin-only (uploader can delete their files)
  - Removes file from database

### 4. **Admin Page** (`app/admin/files/page.tsx`)
- Upload interface with drag-and-drop
- File list with sizes and upload dates
- Delete functionality
- Admin-only access (verified via API)

### 5. **Student/User File Browser** (`app/student/files/page.tsx`)
- Browse all available files
- Download files
- View file details (size, uploader, date)
- File type icons

## Setup Instructions

### 1. Set Admin Status
To make a user an admin, update their record in MongoDB:

```javascript
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { isAdmin: true } }
)
```

Or use MongoDB Atlas UI to manually set `isAdmin: true`

### 2. Database Schema Migration
Since you're using existing data, you need to add the `isAdmin` field:

```javascript
// In MongoDB console or Atlas UI
db.users.updateMany({}, { $set: { isAdmin: false } })
```

### 3. Environment Variables
Ensure your `.env.local` has:
```
MONGODB_URI=your_connection_string
NEXTAUTH_SECRET=your_secret_key
NEXTAUTH_URL=http://localhost:3000
```

## Usage

### For Admins
1. Sign in with admin account
2. Navigate to `/admin/files`
3. Upload files using drag-and-drop or click to browse
4. View all uploaded files
5. Delete files as needed

### For Regular Users
1. Sign in with user account
2. Navigate to `/student/files`
3. Browse available files
4. Click "Download" to get files to your computer

## File Storage
Files are stored as binary data in MongoDB. For production:
- Consider using AWS S3, Google Cloud Storage, or similar
- Store only references in MongoDB instead of binary data
- Implement file cleanup/archival policies

## Security Features
- Admin-only upload verification (checked at API level)
- Authentication required for all file operations
- File type validation (only PDF, Excel, Word allowed)
- File size limits (50MB maximum)
- Unique filenames to prevent conflicts

## Troubleshooting

### Files not visible
- Ensure user is authenticated
- Verify MONGODB_URI is set correctly
- Check MongoDB connection

### Upload fails
- Check file type (must be PDF, Excel, or Word)
- Verify file size < 50MB
- Ensure you're logged in as admin

### Download not working
- Clear browser cache
- Check file exists in database
- Verify MongoDB has the file data

## Future Enhancements
- File versioning
- File sharing between specific users
- Virus scanning for uploads
- Search and filter functionality
- File preview (especially for PDFs)
- Bulk upload
- File expiration policies
