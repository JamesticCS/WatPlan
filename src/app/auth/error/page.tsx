"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Inner component that uses useSearchParams
function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // Map error codes to more user-friendly messages
  const errorMessages: Record<string, string> = {
    "Configuration": "There's a problem with the authentication configuration.",
    "AccessDenied": "You denied access to your account.",
    "Verification": "The verification link is invalid or has expired.",
    "OAuthSignin": "There was a problem starting the OAuth sign in process.",
    "OAuthCallback": "There was a problem with the OAuth callback.",
    "OAuthCreateAccount": "There was a problem creating your account with the OAuth provider.",
    "EmailCreateAccount": "There was a problem creating your email account.",
    "Callback": "There was a problem with the authentication callback.",
    "OAuthAccountNotLinked": "This email is already associated with another account.",
    "EmailSignin": "There was a problem sending the verification email.",
    "CredentialsSignin": "The email or password you entered is incorrect.",
    "default": "An unexpected authentication error occurred."
  };

  // Get a user-friendly error message
  const errorMessage = errorMessages[error || ""] || errorMessages.default;
  
  // Additional debug info for specific errors
  let debugInfo = null;
  if (error === "OAuthCallback" || error === "OAuthSignin") {
    debugInfo = (
      <div className="mt-4 text-sm p-3 bg-amber-50 border border-amber-200 rounded-md text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
        <p className="font-medium mb-2">Troubleshooting tips:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Ensure your browser accepts cookies from this site</li>
          <li>Try disabling any ad blockers or privacy extensions</li>
          <li>Clear your browser cache and cookies</li>
          <li>Try a different browser</li>
          <li>If using GitHub, ensure you granted all required permissions</li>
        </ul>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
        <CardDescription>
          There was a problem signing you in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200">
          <p className="font-medium">Error: {error || "Unknown error"}</p>
          <p className="mt-2">{errorMessage}</p>
          {error && <p className="text-xs mt-3 text-gray-600 dark:text-gray-400">Error code: {error}</p>}
        </div>
        {debugInfo}
        <p>Please try again or contact support if the problem persists.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href="/auth/signin">
          <Button variant="outline">Back to Sign In</Button>
        </Link>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Loading fallback
function AuthErrorLoading() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Authentication Error</CardTitle>
        <CardDescription>
          There was a problem signing you in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 border rounded">
          <p className="font-medium">Loading error details...</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Link href="/auth/signin">
          <Button variant="outline">Back to Sign In</Button>
        </Link>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

// Main component with Suspense boundary
export default function AuthErrorPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container flex items-center justify-center py-10">
        <Suspense fallback={<AuthErrorLoading />}>
          <AuthErrorContent />
        </Suspense>
      </main>
    </div>
  );
}