"use client";

import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600">Privacy Policy</h1>
          
          <div className="prose max-w-none">
            <p className="text-sm mb-6 text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
            
            <p className="mb-4">
              WatPlan collects only the information necessary to provide our degree planning service:
            </p>
            
            <ul className="list-disc pl-6 mb-4">
              <li>Email address - for authentication</li>
              <li>Academic information - what you choose to add to your plans</li>
            </ul>
            
            <p className="mb-4">
              We do not sell your data or share it with third parties. All academic information is provided 
              by you voluntarily and stored securely.
            </p>
            
            <p className="mb-4">
              Guest accounts are automatically deleted after 30 days of inactivity.
            </p>
            
            <p>
              For questions, contact <Link href="mailto:jesse.hines@uwaterloo.ca" className="text-primary hover:underline">jesse.hines@uwaterloo.ca</Link>
            </p>
          </div>
        </div>
      </main>
      <footer className="bg-white dark:bg-black py-6 border-t border-gray-200 dark:border-gray-800">
        <div className="container px-4 mx-auto">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">© {new Date().getFullYear()} WatPlan</p>
            <nav className="flex gap-6">
              <Link className="text-sm text-gray-600 hover:text-primary" href="/terms">Terms</Link>
              <Link className="text-sm text-primary font-medium" href="/privacy">Privacy</Link>
              <Link className="text-sm text-gray-600 hover:text-primary" href="/">Home</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}