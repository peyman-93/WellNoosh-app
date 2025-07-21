# Supabase Email Configuration Setup

## Issue: Not Receiving Confirmation Emails

Supabase's default email service is very limited for development:
- Only 2-3 emails per hour
- Poor deliverability 
- Emails often don't arrive

## Quick Solution: Disable Email Confirmation (Development Only)

### 1. Go to Supabase Dashboard
- Navigate to https://supabase.com/dashboard/project/hveaokuluelmpdntbcuq
- Go to **Authentication > Settings**

### 2. Disable Email Confirmation
- Find "Email confirmation" setting
- **Turn OFF** "Enable email confirmations"
- Click **Save**

### 3. Update Frontend Code
Since email confirmation is disabled, users will get a session immediately upon signup.

## Alternative: Configure Custom SMTP (Recommended for Production)

### 1. Choose an Email Service
- **Gmail** (free, easy setup)
- **Resend** (developer-friendly)
- **SendGrid** (reliable)
- **AWS SES** (scalable)

### 2. Gmail SMTP Setup (Easiest for Development)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. In Supabase Dashboard:
   - Go to Authentication > Settings > SMTP Settings
   - Enable Custom SMTP
   - Host: `smtp.gmail.com`
   - Port: `587`
   - Username: `your-email@gmail.com`
   - Password: `your-app-password`
   - Sender email: `your-email@gmail.com`
   - Sender name: `WellNoosh`

### 3. Test Email Delivery
- Try signing up with a new email
- Should receive confirmation email within seconds

## Current Status
- ✅ User creation works (user ID: f5db62cb-853d-4a14-9c24-509ca3733859)
- ❌ Email confirmation not received (default Supabase email service limitation)
- ✅ Backend confirmation route ready
- ✅ Frontend handles confirmation flow

## Next Steps
1. **For immediate testing**: Disable email confirmation in Supabase dashboard
2. **For production**: Set up custom SMTP with Gmail/Resend/SendGrid