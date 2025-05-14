## Required Vercel Environment Variables for WatPlan

### NextAuth Configuration
- `NEXTAUTH_URL`: https://watplan.app
- `NEXTAUTH_SECRET`: A secure random string for JWT encryption

### Database Connection
- `DATABASE_URL`: Your PostgreSQL connection string

### OAuth Providers
- `GITHUB_ID`: Your GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET`: Your GitHub OAuth app client secret (renamed from GITHUB_SECRET)
- `GOOGLE_ID`: Your Google OAuth app client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth app client secret (renamed from GOOGLE_SECRET)

### Email Service (for Verification)
#### Option 1: Resend (Recommended)
- `RESEND_API_KEY`: Your Resend API key from https://resend.com
- `EMAIL_FROM`: From address for sent emails (e.g., "WatPlan <noreply@watplan.app>")

#### Option 2: SMTP Server (Fallback)
- `EMAIL_SERVER_HOST`: SMTP server host (e.g., smtp.gmail.com)
- `EMAIL_SERVER_PORT`: SMTP server port (e.g., 587)
- `EMAIL_SERVER_USER`: SMTP server username
- `EMAIL_SERVER_PASSWORD`: SMTP server password
- `EMAIL_FROM`: From address for sent emails (e.g., "WatPlan <noreply@watplan.app>")
- `EMAIL_SERVER_SECURE`: Set to "true" if using SSL/TLS

### Google OAuth Notes
1. Make sure your Google OAuth configuration includes:
   - Authorized JavaScript origins: 
     - https://watplan.app
     - https://www.watplan.app
   - Authorized redirect URIs:
     - https://watplan.app/api/auth/callback/google
     - https://www.watplan.app/api/auth/callback/google

2. If your Google configuration is showing the consent screen but returning to sign-in page:
   - Double-check that the callback URL exactly matches what's configured in Google OAuth
   - Verify that NEXTAUTH_URL is correctly set to https://watplan.app
   - Ensure that the user's cookies are being correctly set (check for "Secure" and "SameSite" issues)

3. For testing Google OAuth locally, add these additional URIs in Google Cloud Console:
   - Authorized JavaScript origins: http://localhost:3000
   - Authorized redirect URIs: http://localhost:3000/api/auth/callback/google

### GitHub OAuth Notes
1. Make sure your GitHub OAuth App configuration includes:
   - Homepage URL: https://watplan.app
   - Authorization callback URL: https://watplan.app/api/auth/callback/github
   
2. If your GitHub configuration is redirecting back to the sign-in page:
   - Verify that GITHUB_ID and GITHUB_CLIENT_SECRET are correctly set in environment variables
   - Check that the callback URL exactly matches what's configured in GitHub OAuth App
   - Ensure user is granting all required permissions during the authorization flow
   - Verify there are no cookie restrictions in the user's browser

3. For testing GitHub OAuth locally, update your GitHub OAuth App with:
   - Authorization callback URL: http://localhost:3000/api/auth/callback/github