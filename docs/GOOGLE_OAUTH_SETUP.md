# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your WellNoosh app.

## 1. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID

### Step 2: Enable Google+ API
1. Navigate to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Configure the OAuth client:
   - **Name**: WellNoosh App
   - **Authorized redirect URIs**: 
     - `https://your-project-id.supabase.co/auth/v1/callback`
     - `exp://localhost:8081` (for development)
     - `com.wellnoosh.app://oauth` (for production)

### Step 4: Get Your Client ID
1. After creating, copy your **Client ID**
2. You'll need this for your `.env` file

## 2. Supabase Configuration

### Step 1: Enable Google Provider
1. Go to your Supabase dashboard
2. Navigate to **Authentication** > **Settings** > **Auth Providers**
3. Find **Google** and toggle it **ON**

### Step 2: Configure Google OAuth
1. Paste your **Google Client ID** in the Client ID field
2. Paste your **Google Client Secret** in the Client Secret field
3. Click **Save**

### Step 3: Update Redirect URLs
1. In the **Site URL** field, add your app's redirect URL:
   - Development: `exp://localhost:8081`
   - Production: `com.wellnoosh.app://oauth`

## 3. App Configuration

### Step 1: Update Environment Variables
Update your `.env` file with your Google Client ID:

```bash
# Google OAuth Configuration
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Step 2: Update app.json (for production)
Add URL schemes to your `app.json`:

```json
{
  "expo": {
    "scheme": "com.wellnoosh.app",
    "platforms": ["ios", "android", "web"]
  }
}
```

## 4. Testing

### Development Testing
1. Make sure your `.env` file has the correct Google Client ID
2. Restart your Expo development server
3. Test Google sign-in from the Welcome screen

### Production Testing
1. Build and deploy your app
2. Test Google sign-in on real devices
3. Verify that users can complete the onboarding flow

## 5. Common Issues & Solutions

### Issue: "Google Client ID not configured"
**Solution**: Make sure `EXPO_PUBLIC_GOOGLE_CLIENT_ID` is set in your `.env` file

### Issue: "Authentication failed"
**Solution**: 
- Check that your redirect URLs are correct in both Google Console and Supabase
- Ensure the Google+ API is enabled
- Verify your client ID and secret are correct

### Issue: "Invalid redirect URI"
**Solution**: 
- Make sure your redirect URI in Google Console matches exactly
- For development: `exp://localhost:8081`
- For production: `com.wellnoosh.app://oauth`

### Issue: Users can't complete onboarding
**Solution**: 
- Check that Supabase RLS policies allow profile creation
- Verify that the `profiles` table exists
- Check console logs for specific errors

## 6. Security Considerations

1. **Never commit your Google Client Secret** - Keep it only in Supabase
2. **Use different OAuth clients** for development and production
3. **Regularly rotate your client secrets**
4. **Monitor OAuth usage** in Google Cloud Console

## 7. Alternative: Demo Mode

If you haven't set up Google OAuth yet, the app will work in demo mode:
- Mock Google authentication will be used
- Users can still test the onboarding flow
- No real accounts are created

To enable demo mode, simply don't set the `EXPO_PUBLIC_GOOGLE_CLIENT_ID` environment variable.

## 8. Next Steps

After setting up Google OAuth:
1. Test the complete authentication flow
2. Verify user profiles are created correctly
3. Test the onboarding experience
4. Consider adding additional OAuth providers (Apple, Facebook, etc.)