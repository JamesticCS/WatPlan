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
        </div>
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