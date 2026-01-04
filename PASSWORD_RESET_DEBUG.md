# Password Reset Debugging Guide

## How to Test the Password Reset Feature

### Step 1: Test Request Email
1. Go to `http://localhost:3001/auth/signin`
2. Click "Forgot Password?"
3. Enter an email that exists in your database
4. Watch the server console for logs:
   - "SMTP connection verified successfully"
   - "Email sent successfully: [response]"

### Step 2: Check the Reset Link
The server console should show something like:
```
Reset Link (if not configured): http://localhost:3001/auth/reset-password?token=abc123def456...&email=user@example.com
```

### Step 3: Click the Email Link
1. Check your email (or server console for the link)
2. Click the reset password link
3. You should see the reset password form

### Step 4: Reset Password
1. Enter new password
2. Confirm password
3. Click "Reset Password"
4. Watch server console for debug logs:
```
=== Reset Password Debug Info ===
Received email: user@example.com
Token hash (first 10): abc123def4
User exists but token mismatch
```

## Troubleshooting

### Email not received:
- Check server console for SMTP errors
- Check spam folder
- Verify email is in the database

### "Invalid or expired reset token" on reset page:
- Check if 30 minutes have passed
- Verify the email matches exactly (case-insensitive)
- Check server console debug logs for token mismatch details

### Token mismatch error:
Common causes:
1. **Email encoding issue** - Email might have spaces/special characters
2. **Token corruption** - Email client wrapping the token in the HTML link
3. **Case sensitivity** - Email addresses should be lowercase
4. **Database sync** - Token not actually saved to database

## Database Check

To verify a user has the reset token, run in MongoDB:
```javascript
db.users.findOne({ email: "user@example.com" }, { passwordResetToken: 1, passwordResetTokenExpiry: 1 })
```

Should show:
```javascript
{
  passwordResetToken: "abc123...hash...",
  passwordResetTokenExpiry: ISODate("2025-11-30T14:30:00Z")
}
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Email not sent | SMTP credentials wrong | Check EMAIL_USER and EMAIL_PASSWORD in .env.local |
| Token invalid | Email mismatch | Ensure user email is lowercase in form |
| Token invalid | Token expired | Click reset link within 30 minutes |
| Token invalid | Database token cleared | Try forgot password again |
| Token invalid | Encoding issue | Check if email has special characters |

## Advanced Debugging

Add this to see all user data:
```bash
# Check if user exists
db.users.findOne({ email: "test@example.com" })

# See last 5 password reset attempts
db.users.find({}, { passwordResetToken: 1, passwordResetTokenExpiry: 1, email: 1 }).sort({ _id: -1 }).limit(5)
```

## Server Console Output to Expect

### Successful forgot-password:
```
SMTP connection verified successfully
Email sent successfully: 250 2.0.0 OK [token-id] - gsmtp
```

### Successful reset-password:
```
=== Reset Password Debug Info ===
Received email: user@example.com
Token hash (first 10): a1b2c3d4e5
```

If you don't see these logs, the issue is likely that:
- The API endpoint isn't being called
- The form validation is failing before submission
- There's a network error
