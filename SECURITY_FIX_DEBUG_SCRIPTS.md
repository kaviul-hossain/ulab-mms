# Security Fix: Removed Hardcoded Secrets from Debug Scripts

## Issue
Two secrets were exposed in debug/test scripts:
1. **Password Reset Token**: `049145f3669e4268a6da3afbe412f589a8a3f51a37d58ebb29e0d9fd66481464`
2. **MongoDB URI with Credentials**: `mongodb+srv://kaviuln:kaviuln@ulab-app.ekgrocw.mongodb.net/?appName=ULAB-App`

These secrets in Git commits and merge requests posed a security risk.

## Solution Applied

### 1. Fixed Scripts
All debug scripts have been updated to use environment variables instead of hardcoded secrets:

- **check-db.js**: Updated to read `MONGODB_URI` and `TEST_URL_TOKEN` from environment
- **test-token.js**: Updated to read `TEST_URL_TOKEN` from environment
- **test-reset.js**: No changes needed (doesn't contain hardcoded secrets)

### 2. Updated .gitignore
Added the following files to `.gitignore` to prevent accidental commits:
```
# debug and testing scripts with sensitive data
check-db.js
test-reset.js
test-token.js
```

### 3. Created Templates
Created template files for reference:
- **check-db.template.js**: Template with usage instructions
- **test-token.template.js**: Template with usage instructions

## How to Use These Scripts

### check-db.js
```bash
# Uses MONGODB_URI from .env.local
# Optional: TEST_URL_TOKEN for token validation
# Optional: TEST_USER_EMAIL to check a specific user (defaults to test@example.com)

node check-db.js
```

### test-token.js
```bash
# Requires TEST_URL_TOKEN environment variable

TEST_URL_TOKEN=your_token_here node test-token.js
```

### test-reset.js
```bash
# No secrets needed - generates random tokens for testing
node test-reset.js
```

## Environment Variables Needed

For `check-db.js`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=App
TEST_URL_TOKEN=optional_token_for_testing
TEST_USER_EMAIL=user_to_check@example.com
```

For `test-token.js`:
```bash
TEST_URL_TOKEN=token_to_hash_and_verify
```

## Best Practices Going Forward

1. ✅ **Never commit hardcoded secrets** to version control
2. ✅ **Use environment variables** for all sensitive data
3. ✅ **Use .env.local** file (which is already in .gitignore) for local development
4. ✅ **Keep debug scripts generic** - use templates for reference
5. ✅ **Document parameters** in script headers with examples
6. ✅ **Add files to .gitignore** that might contain secrets during development

## Security Checklist

- [x] Removed hardcoded secrets from check-db.js
- [x] Removed hardcoded secrets from test-token.js
- [x] Updated files to use environment variables
- [x] Added scripts to .gitignore
- [x] Created template files for reference
- [x] Verified scripts work with environment variables
- [x] Documented usage in this file

## Next Steps

1. Git will now ignore these files in future commits
2. Use the template files as reference when debugging
3. Always pass secrets via environment variables, not hardcoded values
4. Consider using these scripts locally only (never commit local versions with real tokens)
