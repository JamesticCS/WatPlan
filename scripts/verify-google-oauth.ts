#!/usr/bin/env ts-node
/**
 * Script to verify Google OAuth configuration for debugging auth issues
 * Run with: npx ts-node scripts/verify-google-oauth.ts
 */

// Check environment variables
const googleId = process.env.GOOGLE_ID;
const googleSecret = process.env.GOOGLE_SECRET;
const nextAuthUrl = process.env.NEXTAUTH_URL;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

console.log('=== Google OAuth Configuration Verification ===');

if (!googleId) {
  console.error('❌ GOOGLE_ID is missing. Set it in your .env file.');
} else {
  console.log('✅ GOOGLE_ID is set.');
}

if (!googleSecret) {
  console.error('❌ GOOGLE_SECRET is missing. Set it in your .env file.');
} else {
  console.log('✅ GOOGLE_SECRET is set.');
}

if (!nextAuthUrl) {
  console.error('❌ NEXTAUTH_URL is missing. Set it in your .env file.');
} else {
  console.log(`✅ NEXTAUTH_URL is set to: ${nextAuthUrl}`);
  
  // Check if callback URL is correctly formed
  const callbackUrl = new URL('/api/auth/callback/google', nextAuthUrl).toString();
  console.log(`🔍 Your Google OAuth callback URL should be: ${callbackUrl}`);
  console.log('   Ensure this exact URL is added to your Google Cloud Console');
}

if (!nextAuthSecret) {
  console.error('❌ NEXTAUTH_SECRET is missing. Set it in your .env file.');
} else {
  console.log('✅ NEXTAUTH_SECRET is set.');
}

console.log('\n=== Checklist for Google Cloud Console ===');
console.log('1. Ensure your app is verified (if in production)');
console.log('2. Check that JavaScript origins include your domain (with correct protocol)');
console.log('3. Verify that authorized redirect URIs include the callback URL shown above');
console.log('4. Confirm that required OAuth scopes are enabled (email, profile)');
console.log('5. Make sure credentials are from the correct Google Cloud project');

console.log('\n=== Next Steps if Authentication Still Fails ===');
console.log('1. Check browser console for CSP errors');
console.log('2. Ensure middleware-csp.ts is correctly set up');
console.log('3. Try authentication flow in an incognito window');
console.log('4. Check NextAuth.js logs by setting DEBUG=true in your .env file');