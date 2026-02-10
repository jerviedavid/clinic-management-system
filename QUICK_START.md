# Quick Start: Google OAuth Setup

## Immediate Next Steps

### 1. Get Google OAuth Credentials (5 minutes)

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Add authorized JavaScript origins:
   - `http://localhost:5173`
7. Add authorized redirect URIs:
   - `http://localhost:5173`
8. Click "Create" and copy your Client ID

### 2. Configure Environment (1 minute)

Create a `.env` file in the project root:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
JWT_SECRET=your_super_secret_key_here
BACKEND_PORT=5000
```

Replace `your_client_id_here` with your actual Google Client ID.

### 3. Update Database (1 minute)

Run this SQL command to add the emailVerified field:

```bash
# Option 1: Using sqlite3 command line
sqlite3 prisma/clinic.db "ALTER TABLE User ADD COLUMN emailVerified BOOLEAN DEFAULT 0;"

# Option 2: Or run the migration file directly
sqlite3 prisma/clinic.db < prisma/migrations/002_add_email_verified.sql
```

### 4. Start Application (1 minute)

```bash
# Install new dependencies (if you haven't already)
npm install

# Start both frontend and backend
npm run dev:all
```

### 5. Test Google Login (1 minute)

1. Open http://localhost:5173/signup in your browser
2. You should see a "Sign up with Google" button
3. Click it and sign in with your Google account
4. You'll be redirected to the doctor dashboard
5. Your email is automatically verified! ✅

## What Just Happened?

✅ **Removed all Firebase dependencies** - Your app now uses Prisma + Express  
✅ **Added Google OAuth** - One-click signup/login with Google  
✅ **Automatic email verification** - Google users are auto-verified  
✅ **Auto role assignment** - New users get DOCTOR + ADMIN roles  
✅ **Trial subscription** - 14-day trial automatically activated  

## Troubleshooting

### Google button doesn't appear?
- Check that `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Make sure you ran `npm install`
- Restart your dev server after adding `.env`

### "Invalid Client" error?
- Verify your Client ID is correct
- Check authorized JavaScript origins in Google Console include `http://localhost:5173`

### Database error?
- Make sure you ran the SQL migration to add `emailVerified` column
- Check that `prisma/clinic.db` exists

### Still having issues?
- Check the browser console for errors
- Check the backend terminal for error logs
- Refer to GOOGLE_OAUTH_SETUP.md for detailed setup

## Next Steps

- Test logging in with Google on `/login` page (also has Google button)
- Try creating multiple accounts with different Google emails
- Check the database to see verified users: `sqlite3 prisma/clinic.db "SELECT * FROM User;"`

## Production Deployment

Before deploying to production:

1. Add your production URL to Google OAuth authorized origins
2. Set `VITE_GOOGLE_CLIENT_ID` environment variable on your hosting platform
3. Ensure HTTPS is enabled
4. Test the OAuth flow in production

## Documentation

- Full setup guide: [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)
- Implementation details: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

---

**You're all set! 🚀** Google OAuth is ready to use on both signup and login pages, with automatic email verification!
