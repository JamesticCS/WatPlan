## Required Vercel Environment Variables for WatPlan

### NextAuth Configuration
- `NEXTAUTH_URL`: https://watplan.app
- `NEXTAUTH_SECRET`: A secure random string for JWT encryption

### Database Connection
- `DATABASE_URL`: Your PostgreSQL connection string

### OAuth Providers
- `GITHUB_ID`: Your GitHub OAuth app client ID
- `GITHUB_SECRET`: Your GitHub OAuth app client secret
- `GOOGLE_ID`: Your Google OAuth app client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth app client secret (renamed from GOOGLE_SECRET)

### Email Service (for Verification)
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