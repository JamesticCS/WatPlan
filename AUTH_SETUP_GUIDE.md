# Authentication Setup Guide for WatPlan

This guide explains how to set up and troubleshoot authentication for WatPlan.

## Environment Variables

Set the following environment variables in your `.env.local` file for development or in your Vercel project settings for production:

```
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000  # Use your domain URL for production
NEXTAUTH_SECRET=your-secret-key     # Generate with 'openssl rand -base64 32'

# OAuth Providers
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Email (for verification emails)
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@example.com
```

## Setting Up OAuth Providers

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Set up the OAuth consent screen if prompted:
   - Add your app name, email, etc.
   - Add scopes for "email" and "profile"
6. Configure the OAuth client ID:
   - Application type: Web application
   - Name: WatPlan (or your app name)
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
7. Copy the Client ID and Client Secret to your environment variables

### GitHub OAuth

1. Go to GitHub Developer Settings > [OAuth Apps](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the details:
   - Application name: WatPlan (or your app name)
   - Homepage URL: `http://localhost:3000` (or your production URL)
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github` (or your production callback)
4. Copy the Client ID and Client Secret to your environment variables

## Content Security Policy (CSP) for Google OAuth

If you encounter issues with Google OAuth (being redirected back to sign-in page after clicking your account), you might need to configure Content Security Policy correctly. WatPlan includes a special middleware for this:

- `src/middleware-csp.ts` - Adds CSP headers for auth routes
- This allows Google's scripts to execute properly

If you need to debug OAuth issues further, run:

```
npx ts-node scripts/verify-google-oauth.ts
```

## Guest Accounts

WatPlan supports guest accounts that expire after 30 days:

- Guest accounts are created with a "guest" provider
- They can be converted to permanent accounts
- Automated cleanup runs daily at 3AM (using scheduler)
- Run manual cleanup: `npm run cleanup:guests`

## Email Verification

Email verification is required for email/password accounts:

1. User registers with email/password
2. Verification email is sent with a token link
3. User clicks link to verify their email
4. User can then sign in with their account

## Troubleshooting

### Google OAuth Issues

If Google OAuth isn't working:

1. Check console for CSP errors
2. Verify redirect URIs are exactly correct (including protocol)
3. Ensure environment variables are set properly
4. Try using an incognito window for testing
5. Check that `middleware-csp.ts` is applying to auth routes
6. Run verification script: `npx ts-node scripts/verify-google-oauth.ts`

### NextAuth.js Debugging

To enable debugging:

```
# In your .env file
DEBUG=true
```

This will output detailed NextAuth.js logs to help diagnose issues.

## Authentication Flow

1. User visits sign-in page (`/auth/signin`)
2. User selects authentication method
3. Authentication provider handles validation
4. On success, user is redirected to `/plans`
5. Session is stored using JWT strategy
6. Protected routes are enforced by middleware