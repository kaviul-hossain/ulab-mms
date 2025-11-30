# Password Reset Testing & Debugging Steps

## Quick Test

### 1. Create a Test User (If Not Exists)
Go to: `http://localhost:3001/auth/signup`
- Name: Test User  
- Email: test@example.com
- Password: password123
- Sign up

### 2. Test Forgot Password Flow
1. Go to: `http://localhost:3001/auth/signin`
2. Click "Forgot Password?" link
3. Enter: `test@example.com`
4. **Watch the browser console** (F12 → Console)
5. **Watch the server terminal** for logs

#### What You Should See:

**Browser Console:**
- Page loads normally
- May see network request to `/api/auth/forgot-password`

**Server Terminal:**
```
SMTP connection verified successfully
Email sent successfully: 250 2.0.0 OK [random-id] - gsmtp
```

Or if email not configured:
```
Reset Link (email not configured): http://localhost:3001/auth/reset-password?token=abc123...&email=test%40example.com
```

### 3. Copy the Reset Link
If using console fallback, copy the link shown in server terminal.
If using email, check `test@example.com` inbox (it might take 30 seconds).

### 4. Click the Reset Link
Paste or click the reset link in browser address bar.

#### What You Should See:

**Browser Console (F12 → Console):**
```
=== Reset Password Page Loaded ===
Token received: abc123def456...
Email received: test%40example.com
Email decoded: test@example.com
```

You should see the "Create New Password" form appear.

### 5. Enter New Password
- New Password: newpassword123
- Confirm Password: newpassword123
- Click "Reset Password"

#### What You Should See:

**Browser Console:**
```
Submitting reset password request:
Email: test@example.com
Token preview: abc123def456...
Response status: 200
Response data: {message: "Password has been reset successfully"}
```

**Server Terminal:**
```
=== Reset Password Debug Info ===
Received email: test@example.com
Token hash (first 10): a1b2c3d4e5
```

Page should redirect to signin automatically.

### 6. Test New Password
- Go to: `http://localhost:3001/auth/signin`
- Email: test@example.com
- Password: newpassword123
- Should login successfully!

---

## Troubleshooting

### Problem: "Missing required fields" on reset

**Browser Console Shows:**
```
Submitting reset password request:
Email: null
Token preview: undefined...
```

**Solution:**
- The URL parameters aren't being read properly
- Check if the URL in browser address bar has `?token=...&email=...`
- Try copying exact URL from server console output

### Problem: "Invalid or expired reset token"

**Server Console Shows:**
```
=== Reset Password Debug Info ===
Received email: test@example.com
Token hash (first 10): a1b2c3d4e5
User exists but token mismatch
User has reset token: false
```

**This means:**
- The token was not saved to the database!
- Go back and click "Forgot Password?" again
- Check server logs for email sending errors

**Server Console Shows:**
```
User exists but token mismatch
Token valid?: false
```

**This means:**
- More than 30 minutes have passed
- Click "Forgot Password?" again to get a new token

### Problem: Email not sent

**Server Console Shows:**
```
Email sending failed: ...error message...
Full error: Error: Invalid login credentials
```

**Solution:**
- Your Gmail App Password is wrong
- Generate a new one at: https://myaccount.google.com/apppasswords
- Make sure you copied it exactly (16 characters, with spaces)
- Update `.env.local` and restart the dev server

**Server Console Shows:**
```
Email sending failed: connect ECONNREFUSED 127.0.0.1:465
```

**Solution:**
- Internet connection issue
- Gmail SMTP server unreachable
- Try testing with `npm run dev` - server logs should show connection attempt

### Problem: Reset link in email doesn't work

**Email shows link but clicking it:**
- Redirects to signup page
- Shows "Invalid token" error
- Or shows form but token/email missing

**Likely causes:**
- Email client modified the URL
- Token was too long and truncated
- Special characters in email not encoded

**Solution:**
1. Check browser console when clicking link
2. Check URL in address bar - should show `?token=...&email=...`
3. Check server console for debug info
4. Try copy-pasting link into new tab instead of clicking

---

## Advanced Debugging

### Check All Server Logs
Open TWO terminals:
1. One running `npm run dev` (shows server logs)
2. One for other commands

### Manual Database Check
```bash
# Check if reset token exists for user
# Run in MongoDB shell or use MongoDB Atlas UI
db.users.findOne(
  { email: "test@example.com" },
  { passwordResetToken: 1, passwordResetTokenExpiry: 1, createdAt: 1 }
)
```

Expected output if token was created:
```javascript
{
  _id: ObjectId("..."),
  email: "test@example.com",
  passwordResetToken: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  passwordResetTokenExpiry: ISODate("2025-11-30T14:55:30.123Z"),
  createdAt: ISODate("2025-11-30T14:25:30.123Z")
}
```

If `passwordResetToken` is missing or null, the token wasn't saved.

### Enable More Detailed Logging
Edit `/app/api/auth/forgot-password/route.ts` and add:
```typescript
console.log('About to save token to user');
console.log('User before save:', user);
await user.save();
console.log('User after save:', user);
```

---

## Expected Timing

- **Email arrival:** 1-5 seconds
- **Reset link validity:** 30 minutes from request
- **Redirect after reset:** 3 seconds (then to signin)

## Security Notes

- Tokens are hashed with SHA256 before storage
- Tokens are single-use (cleared after successful reset)
- Tokens expire after 30 minutes
- Email must match exactly (lowercase, trimmed)

## Still Not Working?

1. **Check server is running:** `http://localhost:3001` should load
2. **Check email config:** Look for "SMTP connection verified" in logs
3. **Check database:** Verify user exists in MongoDB
4. **Check browser console:** F12 → Console tab for client-side errors
5. **Check server terminal:** Watch for error messages
6. **Restart everything:** Kill node, restart dev server, try again

Common command:
```powershell
taskkill /F /IM node.exe 2>$null; cd 'e:\ULABproj\Final proj\ulab-mms'; npm run dev
```
