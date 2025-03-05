"use client";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { signIn } from "next-auth/react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-b from-amber-50 to-white dark:from-black dark:to-background overflow-hidden">
          <div className="container px-4 md:px-6 relative">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -right-10 top-10 w-72 h-72 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl animate-float dark:mix-blend-soft-light"></div>
              <div className="absolute -left-10 bottom-10 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl animate-float animation-delay-2000 dark:mix-blend-soft-light"></div>
            </div>
            
            <div className="flex flex-col items-center space-y-8 text-center relative z-10">
              <div className="space-y-6 animate-fadeIn">
                <h1 className="text-5xl font-extrabold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-amber-500 to-primary">
                  WatPlan
                </h1>
                <p className="text-xl md:text-2xl font-semibold text-secondary dark:text-primary/90 animate-slideUp animate-delay-100">
                  Your Ultimate UWaterloo Degree Planning Tool
                </p>
                <p className="mx-auto max-w-[800px] text-gray-700 md:text-xl dark:text-amber-100/80 animate-slideUp animate-delay-200">
                  Plan your academic journey with confidence. Track your progress, explore courses, and ensure you meet all your degree requirements in one place.
                </p>
              </div>
              <div className="animate-slideUp animate-delay-300">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg font-medium bg-primary text-black hover:bg-primary/90 dark:hover:bg-primary/80 dark:text-black shadow-lg hover:shadow-primary/20 transition-all duration-300"
                  onClick={() => {
                    console.log("Homepage: Sign In to Get Started button clicked");
                    signIn(undefined, { callbackUrl: "/plans" });
                  }}
                >
                  Sign In to Get Started
                </Button>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-16 md:py-24 bg-white dark:bg-black relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-black/5 dark:bg-grid-white/5 bg-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
          <div className="container px-4 md:px-6 relative z-10">
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl text-center mb-16 animate-fadeIn">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600 dark:from-primary dark:to-amber-400">
                How WatPlan Works
              </span>
            </h2>
            <div className="grid gap-10 lg:grid-cols-3 items-start">
              <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-black animate-slideUp group">
                <div className="h-2 bg-primary w-full"></div>
                <div className="p-8 h-full flex flex-col items-center text-center space-y-5">
                  <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-4 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-amber-100">Create Your Plan</h3>
                  <p className="text-gray-600 dark:text-amber-100/70 flex-1">
                    Start by creating a new degree plan. Add your program, major, minors, and any specializations you're pursuing.
                  </p>
                </div>
              </Card>
              <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-black animate-slideUp animate-delay-100 group">
                <div className="h-2 bg-primary w-full"></div>
                <div className="p-8 h-full flex flex-col items-center text-center space-y-5">
                  <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-4 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-amber-100">Add Courses</h3>
                  <p className="text-gray-600 dark:text-amber-100/70 flex-1">
                    Browse our comprehensive course catalog and add courses you've taken or plan to take. Organize them by term to visualize your journey.
                  </p>
                </div>
              </Card>
              <Card className="overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-black animate-slideUp animate-delay-200 group">
                <div className="h-2 bg-primary w-full"></div>
                <div className="p-8 h-full flex flex-col items-center text-center space-y-5">
                  <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-4 w-20 h-20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-9 w-9 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-amber-100">Track Progress</h3>
                  <p className="text-gray-600 dark:text-amber-100/70 flex-1">
                    WatPlan automatically tracks your progress toward degree completion. See which requirements you've met and what's still needed.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>
        
        <section className="w-full py-16 md:py-24 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          <div className="container px-4 md:px-6">
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="md:w-1/2 space-y-6 animate-slideInRight">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl lg:text-5xl text-gray-900 dark:text-amber-100">
                  Why Use <span className="text-primary">WatPlan</span>?
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="h-7 w-7 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-amber-100/90 text-lg">All UWaterloo programs and requirements in one place</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="h-7 w-7 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-amber-100/90 text-lg">Save time planning your courses each term</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="h-7 w-7 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-amber-100/90 text-lg">Avoid graduation surprises with real-time requirement tracking</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="h-7 w-7 text-primary flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700 dark:text-amber-100/90 text-lg">Explore "what-if" scenarios for changing programs</span>
                  </li>
                </ul>
              </div>
              <div className="md:w-1/2 animate-fadeIn animate-delay-200">
                <div className="rounded-2xl shadow-2xl overflow-hidden border border-primary/20">
                  <div className="h-10 bg-gradient-to-r from-black to-gray-800 dark:from-primary dark:to-amber-600 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-black dark:from-black dark:to-gray-900 p-6 flex items-center justify-center">
                    <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-8 backdrop-blur-sm transform -rotate-1 animate-float hover:rotate-0 transition-transform">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-36 w-36 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998a12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-white dark:bg-black py-8 w-full shrink-0 border-t border-gray-200 dark:border-gray-800">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="mb-4 sm:mb-0">
              <p className="text-sm text-gray-600 dark:text-amber-100/60">
                © {new Date().getFullYear()} WatPlan. All rights reserved.
              </p>
            </div>
            <nav className="flex gap-6">
              <Link className="text-sm text-gray-600 hover:text-primary dark:text-amber-100/60 dark:hover:text-primary transition-colors" href="#">
                Terms of Service
              </Link>
              <Link className="text-sm text-gray-600 hover:text-primary dark:text-amber-100/60 dark:hover:text-primary transition-colors" href="#">
                Privacy
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}