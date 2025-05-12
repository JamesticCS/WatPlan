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
    // Check for development bypass
    const bypassParam = searchParams.get('bypass');
    const emailParam = searchParams.get('email');
    const isDevBypass = bypassParam === 'dev-only' && emailParam;

    async function verifyEmail() {
      // Handle development bypass
      if (isDevBypass) {
        try {
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailParam }),
          });

          const data = await response.json();

          if (response.ok) {
            setStatus('success');
            setMessage('Development mode: Email verified without sending verification email. You can now sign in.');
          } else {
            setStatus('error');
            setMessage(data.message || 'Development verification failed.');
          }
          return;
        } catch (error) {
          setStatus('error');
          setMessage('An error occurred during development verification.');
          console.error('Development verification error:', error);
          return;
        }
      }

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
                
                {/* Always show for development testing */}
                {(
                  <div className="mt-6 p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg shadow-sm text-sm transition-all duration-300 hover:shadow-md animate-fadeIn">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-3">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                        <path d="M12 19c0-4.2-2.8-7-7-7m14 0c-4.2 0-7 2.8-7 7M5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                      </svg>
                      <h4 className="font-medium">Development Mode</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <p className="text-slate-600 dark:text-slate-400">
                        To manually verify any email during development:
                      </p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 font-mono text-xs overflow-x-auto">
                        <span className="text-slate-500 dark:text-slate-400">/auth/verify?bypass=dev-only&email=</span>
                        <span className="text-indigo-600 dark:text-indigo-400">your@email.com</span>
                      </div>
                      
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Replace "your@email.com" with the email you registered with.
                      </p>
                    </div>
                  </div>
                )}
                
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