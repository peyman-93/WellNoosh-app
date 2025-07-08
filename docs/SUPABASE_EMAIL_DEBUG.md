# Supabase Email Validation Debug Guide

## Current Issue
The error `Email address "test@gmail.com" is invalid` suggests Supabase has email validation restrictions.

## Things to Check in Supabase Dashboard

### 1. Authentication Settings
1. Go to your Supabase dashboard
2. Navigate to **Authentication** → **Settings** → **General**
3. Check these settings:

#### **Email Domain Restrictions**
- Look for "Allowed email domains" or "Domain allowlist"
- If this is set, it might be blocking Gmail addresses
- **Solution**: Add `gmail.com` to the allowlist or disable domain restrictions

#### **Email Validation**
- Check if "Email confirmation required" is enabled
- If yes, users need to confirm their email before the account is created
- **Solution**: For testing, you can disable this temporarily

#### **User Management**
- Check if "Enable new user signups" is enabled
- **Solution**: Make sure this is ON

### 2. Rate Limiting
- Check if there are rate limits on sign-ups
- Multiple failed attempts might have triggered rate limiting
- **Solution**: Wait a few minutes or try a different email

### 3. Email Provider Settings
- Check if email sending is configured
- If not configured, email confirmations will fail
- **Solution**: Configure SMTP or use Supabase's email service

## Recommended Fixes

### Option 1: Try a Different Email
Instead of `test@gmail.com`, try:
- Your real email address
- A unique email like `yourname+test@gmail.com`
- A different domain like `yourname@outlook.com`

### Option 2: Disable Email Confirmation (for testing)
1. Go to Authentication → Settings → General
2. Turn OFF "Enable email confirmations"
3. This allows immediate account creation without email verification

### Option 3: Check Domain Allowlist
1. Go to Authentication → Settings → General
2. Look for "Allowed email domains"
3. Either remove restrictions or add `gmail.com`

## Testing Steps
1. Make the changes above
2. Try signing up with your real email
3. Check if the account gets created successfully
4. Re-enable security settings after testing