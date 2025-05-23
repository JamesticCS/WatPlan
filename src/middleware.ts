import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Paths that are publicly accessible
const publicPaths = ["/", "/auth/signin"];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Check if the path is public or auth-related
  const isPublicPath = 
    publicPaths.some((publicPath) => path === publicPath) || 
    path.startsWith("/auth/");

  // For API routes other than auth, we'll let the API handlers check auth
  // This allows API routes to handle their own authentication
  if (path.startsWith("/api/") && !path.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Get the session token
  const token = await getToken({ req });
  const isAuthenticated = !!token;

  // Allow access to public paths regardless of authentication
  if (isPublicPath) {
    return NextResponse.next();
  }

  // If not authenticated and trying to access a protected route, redirect to sign in
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  // Allow authenticated users to access protected routes
  return NextResponse.next();
}

// Configure which paths should be processed by the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth paths
     * 2. /auth paths (authentication routes)
     * 3. /_next paths (Next.js internals)
     * 4. /fonts paths (static resources)
     * 5. /favicon.ico (browser resource)
     */
    "/((?!api/auth|auth/|_next/static|_next/image|fonts|favicon.ico).*)",
  ],
};