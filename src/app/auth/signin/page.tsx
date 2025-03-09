"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { motion } from "framer-motion";

// Interactive particle system with mouse interaction and performance optimizations
const InteractiveParticleBackground = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{
    id: number;
    size: number;
    color: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    opacity: number;
  }>>([]);
  
  // Delayed initialization to prevent blocking UI
  useEffect(() => {
    // Defer particle initialization to avoid initial UI blocking
    const initTimer = setTimeout(() => {
      const colors = [
        "bg-gradient-to-br from-primary/70 to-amber-300/70",
        "bg-gradient-to-br from-blue-500/70 to-indigo-400/70",
        "bg-gradient-to-br from-indigo-500/70 to-purple-400/70",
        "bg-gradient-to-br from-purple-500/70 to-pink-400/70",
        "bg-gradient-to-br from-primary/70 to-yellow-300/70"
      ];
      
      // Start with fewer particles for better initial performance
      const initialCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 60;
      
      const particlesArray = Array.from({ length: initialCount }, (_, i) => ({
        id: i,
        size: Math.floor(Math.random() * 18) + 8, // Mix of different sized particles
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
        y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
        vx: (Math.random() - 0.5) * 1.2, // Slightly reduced initial velocity for performance
        vy: (Math.random() - 0.5) * 1.2,
        opacity: Math.random() * 0.5 + 0.3 // Semi-transparent particles
      }));
      
      setParticles(particlesArray);
      setIsInitialized(true);
    }, 100); // Short delay to allow UI to render first
    
    return () => clearTimeout(initTimer);
  }, []);
  
  // Update mouse position for particle interaction - with throttling
  useEffect(() => {
    if (!isInitialized) return;
    
    let lastMoveTime = 0;
    const THROTTLE_MS = 16; // ~60fps
    
    const handleMouseMove = (e: MouseEvent) => {
      const now = performance.now();
      if (now - lastMoveTime < THROTTLE_MS) return;
      
      lastMoveTime = now;
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isInitialized]);
  
  // Animation frame to update particle positions with performance optimizations
  useEffect(() => {
    if (!isInitialized) return;
    
    let animationFrameId: number;
    let lastFrameTime = 0;
    const TARGET_FPS = 60;
    const FRAME_MIN_TIME = 1000 / TARGET_FPS;
    
    const animateParticles = (timestamp: number) => {
      // Throttle frame rate for consistent performance
      if (timestamp - lastFrameTime < FRAME_MIN_TIME) {
        animationFrameId = requestAnimationFrame(animateParticles);
        return;
      }
      
      lastFrameTime = timestamp;
      
      setParticles(prevParticles => {
        return prevParticles.map(particle => {
          // Calculate distance from mouse
          const dx = mousePosition.x - particle.x;
          const dy = mousePosition.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Apply force based on mouse position (attraction)
          let vx = particle.vx;
          let vy = particle.vy;
          
          if (distance < 250) {
            // Stronger repel when close
            const forceFactor = 0.4;
            vx -= (dx / distance) * forceFactor;
            vy -= (dy / distance) * forceFactor;
          } else if (distance < 500) {
            // Stronger attract at medium distance
            const forceFactor = 0.12;
            vx += (dx / distance) * forceFactor;
            vy += (dy / distance) * forceFactor;
          }
          
          // Less damping for more responsive movement
          vx = vx * 0.96;
          vy = vy * 0.96;
          
          // Faster upward movement
          vy -= 0.03;
          
          // Boundary checking - wrap around the screen with safe access to window
          const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
          const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 1000;
          
          let newX = particle.x + vx;
          let newY = particle.y + vy;
          
          if (newX < -100) newX = windowWidth + 100;
          if (newX > windowWidth + 100) newX = -100;
          if (newY < -100) newY = windowHeight + 100;
          if (newY > windowHeight + 100) newY = -100;
          
          return {
            ...particle,
            x: newX,
            y: newY,
            vx,
            vy
          };
        });
      });
      
      animationFrameId = requestAnimationFrame(animateParticles);
    };
    
    animationFrameId = requestAnimationFrame(animateParticles);
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [mousePosition, isInitialized]);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${particle.color} shadow-lg backdrop-blur-sm`}
          style={{
            height: particle.size,
            width: particle.size,
            x: particle.x,
            y: particle.y,
            opacity: particle.opacity,
          }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            rotate: [0, 360],
          }}
          transition={{
            duration: Math.random() * 15 + 15, // Faster rotation
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
};

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
  const router = useRouter();
  const { toast } = useToast();

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

  return (
    <div className="flex flex-col min-h-screen overflow-hidden relative">
      <Navbar />

      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-blue-50 to-amber-50 dark:from-blue-950 dark:to-amber-950">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-primary/10 animate-flow"></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-black dark:bg-grid-white opacity-[0.2] dark:opacity-[0.2]"></div>
        
        {/* Interactive Particles */}
        <InteractiveParticleBackground />
        
        {/* Large blurred shapes */}
        <div className="absolute -left-48 -top-48 w-96 h-96 rounded-full bg-primary/30 dark:bg-primary/20 blur-3xl"></div>
        <div className="absolute -right-48 bottom-0 w-96 h-96 rounded-full bg-blue-500/30 dark:bg-blue-500/20 blur-3xl"></div>
        <div className="absolute left-1/3 top-1/3 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl"></div>
      </div>
      
      <main className="flex-1 container flex items-center justify-center py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="w-full backdrop-blur-sm bg-white/90 dark:bg-slate-900/90 border border-white/50 dark:border-slate-800/50 shadow-xl">
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
                    
                    {/* Development mode bypass option */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.4 }}
                      className="mt-6 p-4 border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-sm text-sm transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500">
                          <path d="M12 19c0-4.2-2.8-7-7-7m14 0c-4.2 0-7 2.8-7 7M5 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm14 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                        </svg>
                        <h4 className="font-medium">Development Mode</h4>
                      </div>
                      
                      <div className="space-y-3 animate-fadeIn">
                        <p className="text-slate-600 dark:text-slate-400">
                          Skip email verification during development:
                        </p>
                        
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white transition-all duration-300 transform hover:translate-y-[-1px] hover:shadow-md"
                          onClick={() => {
                            router.push(`/auth/verify?bypass=dev-only&email=${encodeURIComponent(email)}`);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          Verify Email Automatically
                        </Button>
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
                    <CardDescription className="text-slate-700 dark:text-slate-300">
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
                      onClick={() => signIn("github", { callbackUrl: "/plans" })}
                      className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all duration-300 py-6 text-slate-700 dark:text-slate-300"
                      disabled={isLoading}
                    >
                      <FaGithub className="w-5 h-5" />
                      <span>GitHub</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => signIn("google", { callbackUrl: "/plans" })}
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
                      <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
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
                        className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 focus:border-primary/70 focus:ring-primary/70 transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-700 focus:border-primary/70 focus:ring-primary/70 transition-all duration-300"
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