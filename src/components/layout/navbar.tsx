"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-6 flex">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600 dark:from-primary dark:to-amber-400 group-hover:opacity-90 transition-opacity">WatPlan</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-4 md:justify-end">
          <nav className="flex items-center space-x-4">
            {session && (
              <>
                <Link 
                  href="/plans" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/plans" ? "text-primary font-semibold" : "text-foreground/70"
                  }`}
                >
                  My Plans
                </Link>
                <Link 
                  href="/courses" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/courses" ? "text-primary font-semibold" : "text-foreground/70"
                  }`}
                >
                  Courses
                </Link>
                <Link 
                  href="/programs" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/programs" ? "text-primary font-semibold" : "text-foreground/70"
                  }`}
                >
                  Programs
                </Link>
              </>
            )}
            {session ? (
              <Button 
                variant="outline" 
                onClick={() => signOut()}
                className="border-primary/20 hover:bg-primary/10 hover:text-primary font-medium transition-all"
              >
                Sign Out
              </Button>
            ) : (
              <Button 
                variant="default" 
                onClick={() => {
                  console.log("Navbar: Sign In button clicked");
                  signIn(undefined, { callbackUrl: "/plans" });
                }}
                className="bg-primary text-black hover:bg-primary/90 font-medium transition-all shadow-sm hover:shadow-primary/20"
              >
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}