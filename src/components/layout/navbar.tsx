"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">WatPlan</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            <Link 
              href="/plans" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/plans" ? "text-primary" : "text-foreground/60"
              }`}
            >
              My Plans
            </Link>
            <Link 
              href="/courses" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/courses" ? "text-primary" : "text-foreground/60"
              }`}
            >
              Courses
            </Link>
            <Link 
              href="/programs" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === "/programs" ? "text-primary" : "text-foreground/60"
              }`}
            >
              Programs
            </Link>
            {session ? (
              <Button variant="ghost" onClick={() => signOut()}>
                Sign Out
              </Button>
            ) : (
              <Button variant="default" onClick={() => signIn()}>
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}