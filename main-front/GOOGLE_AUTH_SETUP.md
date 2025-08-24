# Google Authentication Setup Guide

## Complete Step-by-Step Setup

### 1. Google Cloud Console Setup

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create/Select Project**: Create a new project or select existing
3. **Enable APIs**:
   - Go to "APIs & Services" → "Library"
   - Enable "Google+ API" (or "People API")
   - Enable "Google Drive API" (optional)

### 2. Create OAuth 2.0 Credentials

Create **3 different OAuth clients**:

#### **Web Application (for Supabase)**
- Application type: **Web application**  
- Authorized redirect URIs: 
  ```
  https://vzxolhzavyydphqwsmuv.supabase.co/auth/v1/callback
  ```
- **Save the Client ID and Client Secret** (needed for Supabase)

#### **Android Application**
- Application type: **Android**
- Package name: `com.wellnoosh.mainfront`
- SHA-1 certificate fingerprint:
  ```bash
  # For development (debug keystore):
  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
  
  # For production, use your release keystore
  ```

#### **iOS Application** 
- Application type: **iOS**
- Bundle ID: `com.wellnoosh.mainfront`

### 3. Configure Supabase

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **Providers** → **Google**
4. **Enable** Google provider
5. Add your **Web Application** credentials:
   - **Client ID**: `your-web-client-id.apps.googleusercontent.com`
   - **Client Secret**: `your-web-client-secret`

### 4. Update Environment Variables

Update your `.env` file:
```bash
# Replace with your WEB OAuth client ID
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

### 5. Update Configuration Files

#### **google-services.json** (Android)
Download from Google Cloud Console:
1. Go to your Android OAuth client
2. Download `google-services.json`
3. Replace the placeholder file in your project root

#### **GoogleService-Info.plist** (iOS)  
Download from Google Cloud Console:
1. Go to your iOS OAuth client  
2. Download `GoogleService-Info.plist`
3. Replace the placeholder file in your project root

### 6. Install and Configure Dependencies

```bash
npm install @react-native-google-signin/google-signin
```

The configuration is already set up in:
- `app.json` - Expo plugin configuration
- `src/context/supabase-provider.tsx` - Google Sign-In implementation

### 7. Test the Implementation

1. **Development**: 
   ```bash
   npm start
   ```

2. **Test Google Sign-In**:
   - Tap "Continue with Google" button
   - Should open Google OAuth flow
   - After successful authentication, should return to app

### 8. Troubleshooting

#### **Common Issues**:

1. **"Sign in cancelled by user"**
   - Normal when user cancels the OAuth flow

2. **"Network error"** 
   - Check internet connection
   - Verify Google Cloud Console API is enabled

3. **"Invalid client ID"**
   - Make sure you're using the WEB client ID in environment variables
   - Verify the client ID in Supabase matches your Google Cloud Console

4. **"Unauthorized redirect URI"**
   - Add Supabase redirect URI to Google Cloud Console web client
   - Format: `https://your-project-id.supabase.co/auth/v1/callback`

5. **SHA-1 fingerprint issues (Android)**
   - Get debug keystore SHA-1: 
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```
   - Add this SHA-1 to your Android OAuth client in Google Cloud Console

#### **Debug Steps**:

1. Check console logs for detailed error messages
2. Verify all client IDs match between:
   - Google Cloud Console 
   - Supabase dashboard
   - Environment variables
   - Config files
3. Test with Expo development build for better debugging

### 9. Production Deployment

For production builds:
1. Use production SHA-1 certificate for Android OAuth client
2. Update bundle IDs to match production apps  
3. Update redirect URIs if using custom domain

## Current Status

✅ **Completed**:
- Google Sign-In package installed
- Supabase integration configured  
- Expo plugin configured
- Environment variables set up
- Config files created (placeholders)

⚠️ **Requires Manual Setup**:
- Google Cloud Console OAuth clients
- Download actual config files 
- Add SHA-1 fingerprints
- Configure Supabase with Google credentials

The implementation is ready - you just need to complete the Google Cloud Console setup and replace the placeholder config files with real ones from Google.