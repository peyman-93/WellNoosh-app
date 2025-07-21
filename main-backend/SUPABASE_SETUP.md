# Supabase Configuration Setup

## Email Confirmation Setup

To complete the user registration flow with email confirmation, you need to configure the Supabase dashboard:

### 1. Go to Supabase Dashboard
- Navigate to https://supabase.com/dashboard
- Select your project: `hveaokuluelmpdntbcuq`

### 2. Configure Auth Settings
- Go to **Authentication > Settings**
- Set **Site URL** to: `http://localhost:3000`
- In **Redirect URLs**, add: `http://localhost:3000`

### 3. Email Template (Optional)
If you want to customize the email template:
- Go to **Authentication > Email Templates**
- Select "Confirm signup" template
- Make sure the confirmation link uses `{{ .SiteURL }}` or `{{ .RedirectTo }}`

### 4. Current Configuration
- ✅ Backend route `/` handles email confirmation redirects
- ✅ Frontend signup includes `emailRedirectTo: 'http://localhost:3000'`
- ✅ Frontend shows proper confirmation message and switches to login mode

### 5. Test Flow
1. User signs up with email/password → Account created, no session
2. User receives email with confirmation link
3. User clicks link → Redirected to `http://localhost:3000` → Shows success page
4. User returns to app and signs in with email/password → Full session created
5. User can now access health tracking features

### Production Setup
For production, replace `http://localhost:3000` with your actual domain in:
- Supabase Site URL setting
- Supabase Redirect URLs
- Frontend `emailRedirectTo` parameter