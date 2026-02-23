import { NextRequest, NextResponse } from "next/server";

/**
 * This is a custom Google OAuth implementation that works around NextAuth issues.
 * It directly initiates the OAuth flow by redirecting to Google's authorization URL.
 */
export async function GET(req: NextRequest) {
  try {
    // Get credentials from environment variables
    const clientId = process.env.GOOGLE_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;
    
    // Check if the credentials are available
    if (!clientId) {
      console.error("Google OAuth credentials not found");
      return NextResponse.redirect(new URL("/auth/signin?error=GoogleCredentialsMissing", req.url));
    }
    
    // Build the Google OAuth URL
    const googleOAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleOAuthUrl.searchParams.set("client_id", clientId);
    googleOAuthUrl.searchParams.set("redirect_uri", redirectUri);
    googleOAuthUrl.searchParams.set("response_type", "code");
    googleOAuthUrl.searchParams.set("scope", "openid email profile");
    googleOAuthUrl.searchParams.set("access_type", "offline");
    googleOAuthUrl.searchParams.set("prompt", "consent");
    
    // Get the callback URL from the query parameters, defaulting to /plans
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl") || "/plans";
    googleOAuthUrl.searchParams.set("state", encodeURIComponent(callbackUrl));
    
    // Log the flow for debugging
    console.log("[DIRECT GOOGLE AUTH] Redirecting to Google:", googleOAuthUrl.toString());
    
    // Redirect to Google's OAuth page
    return NextResponse.redirect(googleOAuthUrl);
  } catch (error) {
    console.error("[DIRECT GOOGLE AUTH] Error:", error);
    return NextResponse.redirect(new URL("/auth/signin?error=GoogleAuthError", req.url));
  }
}