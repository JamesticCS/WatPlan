import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware that adds Content Security Policy headers to allow Google OAuth to work properly
 */
export function middleware(request: NextRequest) {
  // Generate a nonce for the CSP header
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Create the response
  const response = NextResponse.next();

  // Set CSP header with strict-dynamic to allow Google OAuth scripts
  const cspHeader = [
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-src https://accounts.google.com`,
    `script-src 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    `style-src 'nonce-${nonce}' 'unsafe-inline' https://accounts.google.com/gsi/style`,
    `connect-src https://accounts.google.com`
  ].join('; ');

  // Add the CSP header to the response
  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

// Configure which paths should be processed by the middleware
export const config = {
  matcher: ['/auth/:path*']
};