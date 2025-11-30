# Email Configuration Guide for Password Reset

## Problem with Gmail

If email sending is not working, it's likely because you're using your regular Gmail password. **Gmail requires an App Password** when two-factor authentication (2FA) is enabled.

## Solution: Generate Gmail App Password

Follow these steps to get your App Password:

### Step 1: Enable 2FA on Your Google Account
1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** on the left sidebar
3. Scroll down to **Two-Step Verification** and enable it if not already enabled

### Step 2: Generate App Password
1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. You may need to sign in again
3. Select:
   - **App**: Mail
   - **Device**: Windows Computer (or your device type)
4. Google will generate a **16-character app password**
5. Copy this password (it will be something like: `xxxx xxxx xxxx xxxx`)

### Step 3: Update `.env.local`
1. Open `.env.local` file in your project root
2. Replace the `EMAIL_PASSWORD` value with your new App Password:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```
3. **Save the file**
4. **Restart your development server** (`npm run dev`)

## Testing the Email Feature

1. Go to the signin page: `http://localhost:3001/auth/signin`
2. Click **"Forgot Password?"** link
3. Enter a valid email address from your database
4. Check your email for the reset link
5. If email is not received:
   - Check the **server console** for error messages (they should now be more detailed)
   - Verify the App Password is correct (no extra spaces)
   - Check spam/junk folder

## For Non-Gmail Users

If you're using a different email provider:

### Outlook/Hotmail:
```
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Yahoo Mail:
1. Generate an App Password at [account.yahoo.com](https://account.yahoo.com)
2. Use the generated password in `.env.local`

### Custom SMTP Server:
If you need to modify the SMTP settings, edit `/app/api/auth/forgot-password/route.ts`:

```typescript
const transporter = nodemailer.createTransport({
  host: 'your-smtp-host.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

## Troubleshooting

### Issue: "Invalid login credentials"
- **Solution**: Use the App Password, not your regular Gmail password

### Issue: "Less secure app access"
- **Solution**: Gmail no longer uses this option. You must use an App Password

### Issue: Email not received but no errors
- **Solution**: Check spam folder, verify the email address exists in your database

### Issue: "connection refused" or "timeout"
- **Solution**: Check your internet connection and SMTP server credentials

### Issue: See detailed error in console
- **Solution**: The updated code now logs full error messages. Check the server terminal output

## Verifying Your Setup

1. **Check Environment Variables**: Make sure `.env.local` is in your project root
2. **Restart Server**: Always restart after changing `.env.local`
3. **Check Database**: Verify the user email exists in MongoDB
4. **Check Logs**: Monitor the server console for detailed error messages
5. **Monitor SMTP**: The updated code now logs SMTP verification and send status

## Security Notes

- Never commit `.env.local` to git (it should be in `.gitignore`)
- App Passwords are safer than your main Gmail password
- Reset tokens expire after 30 minutes for security
- Tokens are hashed in the database, never stored in plain text

## Next Steps

Once email is working:
1. Test the complete flow: Forgot Password → Email → Reset Password
2. Verify new password works for login
3. Monitor for any email delivery issues
