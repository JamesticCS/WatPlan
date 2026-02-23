"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
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

// Loading component for Suspense fallback
function SignInLoading() {
  return (
    <div className="flex flex-col min-h-screen overflow-hidden relative">
      <main className="flex-1 container flex items-center justify-center py-10 relative z-10">
        <div className="w-full max-w-md">
          <Card className="w-full backdrop-blur-sm bg-white/95 dark:bg-slate-900/95 border border-white/60 dark:border-slate-800/60 shadow-xl">
            <CardHeader className="space-y-1">
              <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="animate-pulse h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="animate-pulse h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
            <CardFooter>
              <div className="animate-pulse h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}

// Inner component that uses useSearchParams
function SignInContent() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGuestSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signIn("guest", {
        redirect: false,
        callbackUrl: "/plans"
      });

      if (result?.error) {
        toast({
          title: "Error",
          description: "Failed to sign in as guest",
          variant: "destructive",
        });
      } else if (result?.ok) {
        router.push("/plans");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in as guest",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth sign-in handler
  const handleOAuthSignIn = async (provider: string) => {
    setIsLoading(true);
    try {
      await signIn(provider, { callbackUrl: "/plans" });
    } catch (error) {
      console.error(`[AUTH ERROR] ${provider} sign-in failed:`, error);
      toast({
        title: "Authentication Error",
        description: `Failed to sign in with ${provider}`,
        variant: "destructive",
      });
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
            <CardHeader className="space-y-1">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-amber-400 dark:from-primary dark:to-amber-300 bg-clip-text text-transparent pb-1">Welcome to WatPlan</CardTitle>
                <CardDescription className="text-slate-800 dark:text-slate-200">
                  Sign in to create and manage your degree plans
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

              {/* Guest option */}
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
                    Or
                  </span>
                </div>
              </motion.div>

              <motion.div
                variants={fieldVariants}
                initial="hidden"
                animate="visible"
                custom={3}
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
                custom={4}
                className="w-full"
              >
                <Link href="/" className="w-full block">
                  <Button variant="ghost" className="w-full text-slate-700 dark:text-slate-300 bg-transparent hover:bg-white/20 dark:hover:bg-slate-900/20 transition-all duration-300">
                    Back to Home
                  </Button>
                </Link>
              </motion.div>
            </CardFooter>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

// Export the main component with Suspense
export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInContent />
    </Suspense>
  );
}
