"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container flex items-center justify-center py-10">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome to WatPlan</CardTitle>
            <CardDescription>
              Sign in to your account to create and manage your degree plans
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log("Sign-in page: GitHub button clicked");
                  // Mock sign-in by redirecting directly to plans page
                  window.location.href = "/plans";
                }}
                className="flex items-center gap-2"
              >
                <FaGithub className="w-4 h-4" />
                GitHub
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  console.log("Sign-in page: Google button clicked");
                  // Mock sign-in by redirecting directly to plans page
                  window.location.href = "/plans";
                }}
                className="flex items-center gap-2"
              >
                <FaGoogle className="w-4 h-4" />
                Google
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue as guest
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}