# GitHub File Storage Setup Guide

This guide will help you set up GitHub as your file storage backend for the File Explorer.

## 📋 Prerequisites

- GitHub account
- A repository (public or private) for storing files

## 🚀 Setup Steps

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com)
2. Click **"+"** in the top right → **"New repository"**
3. Repository settings:
   - **Name**: `ulab-mms-files` (or your preferred name)
   - **Visibility**: Public (recommended for this test) or Private
   - **Initialize**: Check "Add a README file"
4. Click **"Create repository"**

### Step 2: Generate Personal Access Token (PAT)

1. Go to GitHub Settings:
   - Click your profile picture → **Settings**
   - Scroll down → **Developer settings** (left sidebar)
   - **Personal access tokens** → **Tokens (classic)**

2. Click **"Generate new token"** → **"Generate new token (classic)"**

3. Token settings:
   - **Note**: `ULAB MMS File Storage`
   - **Expiration**: Choose based on your needs (recommend 90 days or No expiration for testing)
   - **Scopes** - Check these permissions:
     - ✅ `repo` (Full control of private repositories)
       - This includes all sub-scopes like `repo:status`, `repo_deployment`, etc.

4. Click **"Generate token"** at the bottom

5. **⚠️ IMPORTANT**: Copy the token immediately! You won't be able to see it again.
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Configure Environment Variables

1. Open your project's `.env.local` file (create if it doesn't exist in the root directory)

2. Add these environment variables:

```env
# GitHub File Storage Configuration
GITHUB_TOKEN=ghp_your_token_here
GITHUB_OWNER=your-github-username
GITHUB_REPO=ulab-mms-files
GITHUB_BRANCH=main
```

**Replace with your values:**
- `GITHUB_TOKEN`: The personal access token you just created
- `GITHUB_OWNER`: Your GitHub username (e.g., `john-doe`)
- `GITHUB_REPO`: Your repository name (e.g., `ulab-mms-files`)
- `GITHUB_BRANCH`: Branch to use (usually `main` or `master`)

**Example:**
```env
GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuvwxyz12
GITHUB_OWNER=johndoe
GITHUB_REPO=ulab-mms-files
GITHUB_BRANCH=main
```

### Step 4: Install Dependencies

Make sure you have all required packages:

```bash
npm install
```

### Step 5: Start the Development Server

```bash
npm run dev
```

### Step 6: Test the File Explorer

1. Open your browser and go to:
   ```
   http://localhost:3000/file-explorer
   ```

2. You should see the GitHub File Explorer interface

## 🧪 Testing Features

### Upload a File
1. Click the **"Upload File"** button
2. Select a file from your computer
3. Wait for the upload to complete
4. The file should appear in the list

### Download a File
1. Click the **download icon** (⬇️) next to any file
2. The file will be downloaded to your computer

### Delete a File
1. Click the **trash icon** (🗑️) next to any file
2. Confirm the deletion
3. The file will be removed from GitHub

### View on GitHub
1. Click the **external link icon** (🔗) next to any file
2. It will open the file on GitHub in a new tab

## 🔍 Verifying Setup

### Check Repository
1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/YOUR_REPO`
2. After uploading files, you should see them in the repository
3. Click on any file to view it on GitHub
4. Check the **Commits** tab to see the upload history (version control!)

### Check File History (Version Control)
1. On GitHub, click any uploaded file
2. Click **"History"** button
3. You'll see all versions/commits of that file
4. Click any commit to see what changed

## 🎯 Features You Can Test

- ✅ Upload files (any type, up to 100MB)
- ✅ Download files
- ✅ Delete files
- ✅ Navigate folders (coming soon)
- ✅ View files on GitHub
- ✅ Automatic version control
- ✅ File history tracking

## 🛠️ Troubleshooting

### Error: "GitHub credentials not configured"
- Make sure you've created `.env.local` file in the project root
- Verify all four environment variables are set correctly
- Restart the development server after adding variables

### Error: "Failed to list files" or 404
- Verify your `GITHUB_OWNER` matches your username exactly
- Verify your `GITHUB_REPO` matches the repository name exactly
- Check if the repository exists and is accessible

### Error: "Bad credentials" or 401
- Your personal access token might be invalid or expired
- Generate a new token and update `.env.local`
- Make sure you selected the `repo` scope when creating the token

### Error: "Failed to upload file"
- Check if your token has `repo` permissions
- Verify the file size is under 100MB
- Check your internet connection

## 📊 GitHub API Limits

- **Rate Limit**: 5,000 requests per hour (authenticated)
- **File Size**: Up to 100MB per file
- **Repository Size**: 5GB recommended (soft limit)

You can check your rate limit status:
```
https://api.github.com/rate_limit
```

## 🔐 Security Notes

- ⚠️ **Never commit** `.env.local` to Git
- ⚠️ Your `.gitignore` should include `.env.local`
- ⚠️ Keep your personal access token secret
- ⚠️ For production, use GitHub Apps instead of personal tokens

## 🎉 Next Steps

Once you've tested and verified everything works:

1. ✅ Test uploading different file types
2. ✅ Test downloading files
3. ✅ Test deleting files
4. ✅ Check version history on GitHub
5. ✅ Let me know if you want to integrate this into the main system!

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console for errors (F12 → Console tab)
2. Check the terminal/server logs for backend errors
3. Verify your environment variables are correct
4. Make sure your repository exists and is accessible

---

**Direct Link to File Explorer:**  
http://localhost:3000/file-explorer
