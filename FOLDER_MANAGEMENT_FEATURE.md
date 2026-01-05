# Admin Folder & File Management Feature

## Overview
Enhanced the admin file upload feature to include folder management. Admins can now create folders and organize files within them for better resource management.

## Features Implemented

### 1. **Folder Management System**
- Create folders to organize resources
- Delete folders (with all contained files and subfolders)
- Organize files in a hierarchical folder structure
- Support for nested folders

### 2. **File Upload with Folder Support**
- Upload files to root or specific folders
- Files maintain their folder context
- Original upload functionality preserved

## Database Model Changes

### Updated File Schema ([models/File.ts](models/File.ts))
Added new fields:
- `isFolder` (Boolean): Identifies if this is a folder or file
- `parentFolderId` (ObjectId): Reference to parent folder (if any)
- `folderPath` (String): Full path to the file/folder for easy querying
- `gridfsId`: Made optional (folders don't need GridFS storage)

```typescript
{
  isFolder: boolean,           // default: false
  parentFolderId: ObjectId | null,  // default: null
  folderPath: string,          // default: "/"
}
```

## API Endpoints

### 1. **Create Folder**
- **Endpoint**: `POST /api/files/folders`
- **Auth**: Admin only
- **Body**: 
  ```json
  {
    "folderName": "string",
    "parentFolderId": "string (optional)"
  }
  ```
- **Response**: Created folder object with ID, name, path, and createdAt

### 2. **List Folders**
- **Endpoint**: `GET /api/files/folders`
- **Auth**: Admin
- **Query Params**:
  - `parentFolderId` (optional): Get folders within specific parent
- **Response**: Array of folders at the specified level

### 3. **Delete Folder**
- **Endpoint**: `DELETE /api/files/folders/[folderId]`
- **Auth**: Admin only
- **Response**: Recursively deletes folder and all contents
- **Returns**: Count of deleted items

### 4. **Upload File** (Updated)
- **Endpoint**: `POST /api/files`
- **Auth**: Admin only
- **Body**: FormData with:
  - `file`: File object
  - `folderId` (optional): Folder ID to upload to
- **Changes**: Now supports optional folder selection

### 5. **List Files** (Updated)
- **Endpoint**: `GET /api/files`
- **Auth**: All authenticated users
- **Query Params**:
  - `folderId` (optional): Files in specific folder
  - `includeAll` (optional): Get all files (default behavior)
- **Changes**: Can filter by folder

## Frontend Components

### Dashboard Updates ([app/dashboard/page.tsx](app/dashboard/page.tsx))

#### New State Variables
- `showCreateFolderModal`: Toggle folder creation dialog
- `folderName`: Input for folder name
- `creatingFolder`: Loading state for folder creation
- `folders`: List of folders
- `selectedFolderId`: Currently selected folder for uploads
- `currentFolderPath`: Current navigation path

#### New Functions
- `fetchFolders(parentFolderId)`: Fetch folders from API
- `handleCreateFolder()`: Create new folder
- `handleDeleteFolder(folderId, folderName)`: Delete folder with confirmation

#### UI Components

**1. Resource Management Card** (Admin Only)
- Located above courses grid
- Shows folder management section
- Display existing folders
- Buttons to create folder and upload files

**2. Create Folder Modal**
- Input for folder name
- Folder name validation (not empty, max 100 chars)
- Success/error messages
- Cancel and Create buttons

**3. File Upload Modal** (Updated)
- New dropdown to select target folder
- "Root Folder" option for root-level uploads
- Folder selection persists during upload session
- Shows all available folders

**4. Folder Display Grid**
- Shows all created folders
- Each folder displays:
  - Folder icon
  - Folder name
  - Creation date
  - Delete button with confirmation
- Empty state when no folders exist

## File Structure
```
/app
  /api
    /files
      route.ts              (Updated - folder support in upload/list)
      /folders
        route.ts            (New - create/list folders)
        /[folderId]
          route.ts          (New - delete folder)
  /dashboard
    page.tsx                (Updated - folder UI added)

/models
  File.ts                   (Updated - new folder fields)
```

## Usage Flow

### For Admins

**Creating Folders:**
1. Go to Dashboard
2. In "Manage Resources" section, click "New Folder"
3. Enter folder name
4. Click "Create Folder"

**Uploading Files to Folders:**
1. Click "Upload File" button
2. Select target folder from dropdown (optional)
3. Choose file to upload
4. Click "Upload File"

**Organizing Resources:**
- Create multiple folders by topic/semester
- Upload related files to each folder
- Delete folders to clean up (with confirmation)

### For Students

**Accessing Files:**
- Files are organized by folders
- Can browse folder structure
- Download files from any folder

## Security Features

✅ **Admin-Only Operations**: Folder creation/deletion requires `isAdmin: true`
✅ **Recursive Deletion**: Safely deletes all nested content
✅ **Path Validation**: Verifies parent folder exists and is actually a folder
✅ **GridFS Cleanup**: Deletes GridFS files when removing from folders

## Backward Compatibility

✅ **Existing Files**: All existing files work without modification
✅ **Root Level**: Files can still be uploaded to root (parentFolderId = null)
✅ **Legacy API**: `GET /api/files?includeAll=true` returns all files regardless of folder

## Future Enhancements

- Rename folders
- Move files between folders
- Bulk upload multiple files
- Folder-level access permissions
- Archive folders
- Folder download as ZIP
- File preview functionality

## Testing Checklist

- [ ] Create folder successfully
- [ ] Create nested folders
- [ ] List folders in folder view
- [ ] Upload file to root
- [ ] Upload file to folder
- [ ] Delete folder with files
- [ ] Delete empty folder
- [ ] Folder path displayed correctly
- [ ] Students can access organized files
- [ ] Folder count displays correctly
