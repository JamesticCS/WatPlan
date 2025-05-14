"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

// Default export with Suspense boundary
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 container flex items-center justify-center py-10">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Email Verification</CardTitle>
              <CardDescription>Loading verification page...</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col items-center pt-4">
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                <p className="text-center text-muted-foreground">Loading verification page...</p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}

// Component with useSearchParams requires Suspense
function VerifyPageContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  useEffect(() => {
    async function verifyEmail() {

      // Normal verification flow
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link. Token is missing.');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! You can now sign in to your account.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Failed to verify email. The link may have expired or is invalid.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email.');
        console.error('Verification error:', error);
      }
    }

    verifyEmail();
  }, [token, searchParams]);

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 container flex items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Email Verification</CardTitle>
            <CardDescription>
              {status === 'loading' ? 'Verifying your email address' : 
               status === 'success' ? 'Your email has been verified' : 
               'Verification failed'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-col items-center pt-4">
            {status === 'loading' && (
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />
                <p className="text-center text-muted-foreground">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center space-y-4 py-8">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-center">{message}</p>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center space-y-4 py-8">
                <XCircle className="h-16 w-16 text-red-500" />
                <p className="text-center text-red-600">{message}</p>
                
                <style jsx global>{`
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                  }
                `}</style>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-center">
            {status === 'success' ? (
              <Link href="/auth/signin">
                <Button>Sign in to your account</Button>
              </Link>
            ) : status === 'error' ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <Link href="/auth/signup">
                  <Button variant="outline">Try signing up again</Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost">Return to home</Button>
                </Link>
              </div>
            ) : null}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}