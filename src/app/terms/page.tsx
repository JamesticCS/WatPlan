"use client";

import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container mx-auto py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-amber-600">Terms of Service</h1>
          
          <div className="prose max-w-none">
            <p className="text-sm mb-6 text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>
            
            <p className="mb-4">
              By using WatPlan, you agree to the following terms:
            </p>
            
            <ul className="list-disc pl-6 mb-4">
              <li>WatPlan is provided "as is" without warranty of any kind</li>
              <li>We are not affiliated with the University of Waterloo</li>
              <li>Information provided by this tool should be verified with official university resources</li>
              <li>We may update these terms at any time without notice</li>
              <li>We reserve the right to terminate accounts that misuse the service</li>
            </ul>
            
            <p className="mb-4">
              WatPlan is currently in beta and may contain bugs or inaccuracies. Always verify your degree 
              requirements with official University of Waterloo resources.
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
              <Link className="text-sm text-primary font-medium" href="/terms">Terms</Link>
              <Link className="text-sm text-gray-600 hover:text-primary" href="/privacy">Privacy</Link>
              <Link className="text-sm text-gray-600 hover:text-primary" href="/">Home</Link>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}