# WatPlan Authentication Setup Guide

This guide will help you set up all authentication methods for WatPlan:
- GitHub OAuth
- Google OAuth
- Email/Password with email verification

## Environment Variables

First, make sure these environment variables are properly set in your production environment:

```
# NextAuth Configuration
NEXTAUTH_URL=https://watplan.app
NEXTAUTH_SECRET=your-strong-secret-key

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Google OAuth
GOOGLE_ID=your-google-client-id
GOOGLE_SECRET=your-google-client-secret

# Email Server (for verification emails)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-smtp-username
EMAIL_SERVER_PASSWORD=your-smtp-password
EMAIL_SERVER_SECURE=false  # Set to true for SSL/TLS
EMAIL_FROM=noreply@watplan.app
```

## Setting up OAuth Providers

### 1. GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click on "New OAuth App"
3. Fill in the following details:
   - **Application name**: WatPlan
   - **Homepage URL**: `https://watplan.app`
   - **Authorization callback URL**: `https://watplan.app/api/auth/callback/github`
4. Click "Register application"
5. Generate a new client secret
6. Copy the Client ID and Client Secret to your environment variables

### 2. Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Configure the OAuth consent screen:
   - User Type: External
   - App name: WatPlan
   - User support email: your-email@example.com
   - Developer contact information: your-email@example.com
6. Add scopes for email and profile information
7. Create the OAuth client ID with the following details:
   - Application type: Web application
   - Name: WatPlan Web Client
   - Authorized JavaScript origins: `https://watplan.app`
   - Authorized redirect URIs: `https://watplan.app/api/auth/callback/google`
8. Copy the Client ID and Client Secret to your environment variables

## Email Service Setup

For email verification, you'll need an SMTP service. Here are some options:

### Option 1: Use a transactional email service like SendGrid

1. Create an account on [SendGrid](https://sendgrid.com/)
2. Create an API key or SMTP credentials
3. Update your environment variables with the SMTP details

### Option 2: Use a regular email provider (Gmail, Outlook, etc.)

For Gmail, you'll need to:
1. Create an app password (if using 2FA)
2. Use your Gmail address as EMAIL_SERVER_USER
3. Use the app password as EMAIL_SERVER_PASSWORD
4. Set EMAIL_SERVER_HOST to smtp.gmail.com

## Testing the Authentication Flow

### Testing Email/Password Registration

1. Visit the signup page: `https://watplan.app/auth/signup`
2. Create an account with a valid email
3. Check your email for a verification link
4. Click the verification link
5. Sign in with your email and password

### Testing OAuth Sign-in

1. Visit the signin page: `https://watplan.app/auth/signin`
2. Click on the GitHub or Google button
3. Complete the OAuth flow
4. You should be redirected back to the application

## Troubleshooting

If you encounter issues:

1. Check environment variables are correctly set
2. Verify OAuth callback URLs match exactly
3. Ensure email server credentials are correct
4. Check the application logs for detailed error messages

### Email Verification in Development Mode

In development, the app creates a test account on Ethereal Email and logs a URL to view the sent email in the console. Look for: "IMPORTANT: Email verification preview URL".

## Security Considerations

- Keep your client secrets and SMTP credentials secure
- In production, ensure to use HTTPS
- Set appropriate session timeouts
- Implement strong password requirements

## Email Templates

The email templates are defined in `src/lib/email-templates.ts`. Customize them as needed for your branding.