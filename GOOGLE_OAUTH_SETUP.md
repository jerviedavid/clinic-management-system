# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the Clinic Management System.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "Clinic Management System")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" for user type
   - Fill in the required fields:
     - App name: "Clinic Management System"
     - User support email: your email
     - Developer contact: your email
   - Click "Save and Continue"
   - Skip the Scopes section (click "Save and Continue")
   - Add test users if needed
   - Click "Save and Continue"

4. Create OAuth Client ID:
   - Application type: "Web application"
   - Name: "Clinic Management Web Client"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production URL (e.g., `https://yourdomain.com`)
   - Authorized redirect URIs:
     - `http://localhost:5173` (for development)
     - Your production URL
   - Click "Create"

5. Copy your Client ID and Client Secret

## Step 4: Configure Environment Variables

1. Create or update the `.env` file in your project root:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_client_secret_here

# Other configurations...
JWT_SECRET=your_super_secret_key_here
BACKEND_PORT=5000
```

2. Replace the placeholder values with your actual credentials from Step 3

## Step 5: Apply Database Schema Changes

Run the following command to add the `emailVerified` field to your database:

```bash
# If Prisma commands work:
npx prisma db push

# Or manually run the SQL migration:
sqlite3 prisma/clinic.db < prisma/migrations/002_add_email_verified.sql
```

Or manually update your database:

```sql
ALTER TABLE User ADD COLUMN emailVerified BOOLEAN DEFAULT 0;
```

## Step 6: Test the Integration

1. Start your development servers:
```bash
npm run dev:all
```

2. Navigate to `http://localhost:5173/signup`

3. You should see a "Sign up with Google" button

4. Click it and sign in with your Google account

5. You should be automatically:
   - Created as a new user (if first time)
   - Assigned DOCTOR and ADMIN roles
   - Given a 14-day trial subscription
   - Email marked as verified
   - Redirected to the doctor dashboard

## How It Works

### Frontend (React)
- Uses `@react-oauth/google` package
- Google login button appears on both `/signup` and `/login` pages
- Sends Google credential token to backend on successful auth

### Backend (Express)
- Receives Google credential token
- Decodes JWT to extract user info (email, name, email_verified)
- Creates new user or logs in existing user
- Users signed up via Google are automatically verified (`emailVerified = true`)
- Returns JWT token and user data

### Automatic Verification
- Users who sign up via Google OAuth have their email automatically verified
- No need for email verification flow for Google users
- Password field is left empty for Google OAuth users (they don't need it)

## Security Notes

1. **Client ID is public**: The `VITE_GOOGLE_CLIENT_ID` is safe to expose in frontend code
2. **Client Secret is private**: Never expose `GOOGLE_CLIENT_SECRET` in frontend code
3. **Token Verification**: In production, you should verify the Google token with Google's API
4. **HTTPS Required**: In production, use HTTPS for all OAuth redirects

## Production Deployment

1. Update Google OAuth settings with production URLs
2. Set environment variables on your hosting platform
3. Ensure HTTPS is enabled
4. Test the OAuth flow in production

## Troubleshooting

### "Invalid Client" Error
- Check that your Client ID is correct in `.env`
- Verify the authorized JavaScript origins in Google Console

### "Redirect URI Mismatch"
- Ensure your redirect URIs in Google Console match your app URLs
- Check for trailing slashes

### Google Button Not Appearing
- Verify `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Check browser console for errors
- Ensure you've installed the `@react-oauth/google` package

### Database Error on Signup
- Make sure the `emailVerified` column exists in User table
- Run the migration: `npx prisma db push` or apply SQL manually

## Additional Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
