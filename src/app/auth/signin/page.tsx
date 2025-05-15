"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { motion } from "framer-motion";


// Enhanced field animation variants
const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: custom * 0.1,
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1.0] 
    },
  }),
};

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);
  const [justVerified, setJustVerified] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  // Check for verified email parameter
  useEffect(() => {
    const verified = searchParams.get('verified');
    const emailParam = searchParams.get('email');
    
    if (verified === 'true' && emailParam) {
      // Set the email field to the verified email
      setEmail(emailParam);
      setJustVerified(true);
      
      // Show a toast notification
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified. Please sign in to continue.",
        variant: "default",
      });
    } else {
      // Also check localStorage for recently verified email
      try {
        if (typeof window !== 'undefined') {
          const storedEmail = localStorage.getItem('verifiedEmail');
          const verifiedAt = localStorage.getItem('verifiedAt');
          
          if (storedEmail && verifiedAt) {
            // Check if verification was recent (within last 5 minutes)
            const verifiedTime = new Date(verifiedAt).getTime();
            const now = new Date().getTime();
            const fiveMinutesInMs = 5 * 60 * 1000;
            
            if (now - verifiedTime < fiveMinutesInMs) {
              setEmail(storedEmail);
              setJustVerified(true);
              
              // Show a toast notification
              toast({
                title: "Email Verified",
                description: "Your email has been successfully verified. Please sign in to continue.",
                variant: "default",
              });
              
              // Clear the storage after using it
              localStorage.removeItem('verifiedEmail');
              localStorage.removeItem('verifiedAt');
            }
          }
        }
      } catch (error) {
        console.error('Error checking localStorage:', error);
      }
    }
  }, [searchParams, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === "EMAIL_NOT_VERIFIED") {
          setVerificationNeeded(true);
        } else {
          throw new Error("Invalid email or password");
        }
      } else {
        router.push("/plans");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("guest", { callbackUrl: "/plans" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in as guest",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Enhanced OAuth sign-in with error handling and logging
  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    
    try {
      // Log which provider is being used
      console.log(`[AUTH] Attempting to sign in with ${provider}`);
      
      // Use signIn with redirect: false to handle errors
      const result = await signIn(provider, { 
        redirect: false,
        callbackUrl: "/plans"
      });
      
      if (result?.error) {
        // Log the error
        console.error(`[AUTH ERROR] ${provider} sign-in failed:`, result.error);
        
        // Show error toast
        toast({
          title: "Authentication Error",
          description: `There was a problem signing in with ${provider}. Please try again.`,
          variant: "destructive",
        });
        
        // If there's a URL, redirect to it (usually the error page)
        if (result.url) {
          router.push(result.url);
        }
      } else if (result?.url) {
        // Success case, redirect to the URL
        console.log(`[AUTH] ${provider} sign-in successful, redirecting to:`, result.url);
        router.push(result.url);
      }
    } catch (error) {
      // Catch any unexpected errors
      console.error(`[AUTH ERROR] Unexpected error during ${provider} sign-in:`, error);
      toast({
        title: "Authentication Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen overflow-hidden relative">      
      <main className="flex-1 container flex items-center justify-center py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="w-full backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 border border-white/60 dark:border-slate-800/60 shadow-xl">
            {verificationNeeded ? (
              <>
                <CardHeader className="space-y-1">
                  <CardTitle className="text-2xl">Email verification required</CardTitle>
                  <CardDescription className="text-slate-700 dark:text-slate-300">
                    Please verify your email before signing in
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="flex flex-col items-center p-6 bg-amber-50/80 dark:bg-amber-950/80 rounded-lg border border-amber-200/80 dark:border-amber-800/80 backdrop-blur-sm">
                    <motion.div 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="rounded-full bg-amber-100 dark:bg-amber-900 p-3 mb-4"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                    </motion.div>
                    <motion.h3 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                      className="text-lg font-medium text-amber-800 dark:text-amber-300 mb-2"
                    >
                      Verification needed
                    </motion.h3>
                    <motion.p 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.4 }}
                      className="text-center text-amber-600 dark:text-amber-400"
                    >
                      Your account has been created but your email is not verified yet.
                    </motion.p>
                    <motion.p 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3, duration: 0.4 }}
                      className="text-center text-amber-600 dark:text-amber-400 mt-2"
                    >
                      Please check your inbox for the verification link we sent.
                    </motion.p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500 text-center">
                      Don't see the email? Check your spam folder or click below to resend.
                    </p>
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                      className="flex justify-center"
                    >
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-sm mx-auto flex bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-sm"
                        onClick={async () => {
                          try {
                            setIsLoading(true);
                            const response = await fetch("/api/auth/resend-verification", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ email }),
                            });
                            
                            if (response.ok) {
                              toast({
                                title: "Verification email sent",
                                description: "Please check your inbox for the verification link.",
                              });
                            } else {
                              throw new Error("Failed to resend verification email");
                            }
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to resend verification email",
                              variant: "destructive",
                            });
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Sending...
                          </span>
                        ) : "Resend verification email"}
                      </Button>
                    </motion.div>
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="mt-6 p-4 border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-sm text-sm transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M12 8v4" />
                          <path d="M12 16h.01" />
                        </svg>
                        <h4 className="font-medium">Need Help?</h4>
                      </div>
                      
                      <div className="space-y-3 animate-fadeIn">
                        <p className="text-slate-600 dark:text-slate-400">
                          If you're having trouble receiving the verification email:
                        </p>
                        
                        <ul className="list-disc list-inside text-sm space-y-1 text-slate-600 dark:text-slate-400">
                          <li>Check your spam/junk folder</li>
                          <li>Make sure you entered your email correctly</li>
                          <li>Try signing up again with the same email</li>
                        </ul>
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="flex-1 mr-2"
                  >
                    <Button 
                      variant="outline" 
                      onClick={() => setVerificationNeeded(false)}
                      className="w-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-white/50 dark:border-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-800/70 transition-all duration-300"
                    >
                      Try another account
                    </Button>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                    className="flex-1 ml-2"
                  >
                    <Link href="/auth/signup" className="block w-full">
                      <Button 
                        variant="default" 
                        className="w-full bg-gradient-to-r from-primary to-amber-500 hover:from-primary hover:to-amber-600 text-black dark:text-black font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-1px]"
                      >
                        Sign up again
                      </Button>
                    </Link>
                  </motion.div>
                </CardFooter>
              </>
            ) : (
              <>
                <CardHeader className="space-y-1">
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-amber-400 dark:from-primary dark:to-amber-300 bg-clip-text text-transparent pb-1">Welcome to WatPlan</CardTitle>
                    <CardDescription className="text-slate-800 dark:text-slate-200">
                      Sign in to your account to create and manage your degree plans
                    </CardDescription>
                  </motion.div>
                </CardHeader>
                <CardContent className="grid gap-6">
                  {/* OAuth providers */}
                  <motion.div 
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Button 
                      variant="outline" 
                      onClick={() => handleOAuthSignIn("github")}
                      className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300 py-6 text-slate-700 dark:text-slate-300"
                      disabled={isLoading}
                    >
                      <FaGithub className="w-5 h-5" />
                      <span>GitHub</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleOAuthSignIn("google")}
                      className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300 py-6 text-slate-700 dark:text-slate-300"
                      disabled={isLoading}
                    >
                      <FaGoogle className="w-5 h-5" />
                      <span>Google</span>
                    </Button>
                  </motion.div>
                  
                  {/* Divider */}
                  <motion.div 
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={2}
                    className="relative"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/30 dark:border-slate-700/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-900 px-2 text-slate-600 dark:text-slate-400">
                        Or sign in with email
                      </span>
                    </div>
                  </motion.div>
                  
                  {/* Email/password form */}
                  <motion.form 
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={3}
                  >
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                          <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z" />
                          <polyline points="15,9 18,9 18,11" />
                          <path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2v0" />
                          <line x1="6" x2="7" y1="10" y2="10" />
                        </svg>
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        required
                        className="bg-white/90 dark:bg-slate-900/90 border-gray-300 dark:border-slate-700 focus:border-primary/70 focus:ring-primary/70 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Password
                        {justVerified && 
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Verified Email
                          </span>
                        }
                      </label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={`bg-white/90 dark:bg-slate-900/90 border-gray-300 dark:border-slate-700 focus:border-primary/70 focus:ring-primary/70 transition-all duration-300 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 ${
                          justVerified ? 'border-green-500 dark:border-green-700 ring-1 ring-green-500 dark:ring-green-700' : ''
                        }`}
                        autoFocus={justVerified} // Focus on password field if user just verified their email
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-black dark:text-black font-semibold py-6 shadow-md hover:shadow-lg transition-all duration-300 transform hover:translate-y-[-2px]" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </span>
                      ) : (
                        "Sign in"
                      )}
                    </Button>
                  </motion.form>
                  
                  <motion.div 
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={4}
                    className="text-center text-sm"
                  >
                    <span className="text-slate-700 dark:text-slate-300">
                      Don't have an account?{" "}
                      <Link href="/auth/signup" className="font-medium text-primary hover:text-primary/80 transition-colors">
                        Sign up
                      </Link>
                    </span>
                  </motion.div>
                  
                  {/* Guest option */}
                  <motion.div 
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={5}
                    className="relative"
                  >
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-white/30 dark:border-slate-700/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white dark:bg-slate-900 px-2 text-slate-600 dark:text-slate-400">
                        Or
                      </span>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={6}
                  >
                    <Button 
                      variant="outline" 
                      className="w-full bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300 py-6"
                      onClick={handleGuestSignIn}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-700 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-slate-700 dark:text-slate-300">Processing...</span>
                        </span>
                      ) : (
                        <>
                          <svg className="mr-2 h-5 w-5 text-slate-700 dark:text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-slate-700 dark:text-slate-300">Continue as guest</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                </CardContent>
                <CardFooter>
                  <motion.div
                    variants={fieldVariants}
                    initial="hidden"
                    animate="visible"
                    custom={7}
                    className="w-full"
                  >
                    <Link href="/" className="w-full block">
                      <Button variant="ghost" className="w-full text-slate-700 dark:text-slate-300 bg-transparent hover:bg-white/20 dark:hover:bg-slate-900/20 transition-all duration-300">
                        Back to Home
                      </Button>
                    </Link>
                  </motion.div>
                </CardFooter>
              </>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  );
}