import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-background">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                  Welcome to WatPlan
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Plan your UWaterloo degree with ease. Track your progress, explore courses, and ensure you meet all your degree requirements.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/plans">
                  <Button className="h-11 px-8">Get Started</Button>
                </Link>
                <Link href="/programs">
                  <Button variant="outline" className="h-11 px-8">
                    Explore Programs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 items-center">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
                  Plan Your Courses
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Add courses to your degree plan and organize them by term. Keep track of what you've completed and what's coming up.
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
                  Track Requirements
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  See which degree requirements you've fulfilled and which ones you still need to complete.
                </p>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tighter md:text-3xl">
                  Multiple Programs
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Add majors, minors, specializations, and more to create a comprehensive view of your academic journey.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} WatPlan. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}