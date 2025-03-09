"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MinimalInteractiveBackground } from "@/components/layout/minimal-background";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen relative">
      {/* Background */}
      <MinimalInteractiveBackground />
      
      {/* Logo */}
      <div className="fixed top-6 left-8 z-50">
        <Link href="/" className="flex items-center space-x-2 group">
          <span className="font-extrabold text-2xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-amber-500 to-primary group-hover:opacity-90 transition-opacity">WatPlan</span>
        </Link>
      </div>

      {children}
    </div>
  );
}