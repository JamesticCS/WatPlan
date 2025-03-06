"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/20 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/50 shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-8 flex">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-amber-500 to-primary group-hover:opacity-90 transition-opacity">WatPlan</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-6 md:justify-end">
          <nav className="flex items-center space-x-6">
            {session && (
              <>
                <Link 
                  href="/plans" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/plans" ? "text-primary font-semibold" : "text-foreground/80"
                  }`}
                >
                  My Plans
                </Link>
                <Link 
                  href="/courses" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/courses" ? "text-primary font-semibold" : "text-foreground/80"
                  }`}
                >
                  Courses
                </Link>
                <Link 
                  href="/programs" 
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    pathname === "/programs" ? "text-primary font-semibold" : "text-foreground/80"
                  }`}
                >
                  Programs
                </Link>
              </>
            )}
            {session ? (
              <Button 
                variant="default" 
                onClick={() => signOut()}
                className="bg-primary text-black hover:bg-primary/90 dark:hover:bg-primary/80 font-medium transition-all shadow-md hover:shadow-primary/20 ml-2"
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
                className="bg-primary text-black hover:bg-primary/90 dark:hover:bg-primary/80 font-medium transition-all shadow-md hover:shadow-primary/20 ml-2"
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