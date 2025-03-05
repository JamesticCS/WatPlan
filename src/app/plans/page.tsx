import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PlansPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Degree Plans</h1>
          <Link href="/plans/new">
            <Button>Create New Plan</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* This would be populated from the database in a client component */}
          <Card>
            <CardHeader>
              <CardTitle>Bachelor of Mathematics</CardTitle>
              <CardDescription>Created on March 5, 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Major: Mathematical Physics
              </p>
              <div className="mt-4">
                <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                  <div className="h-full bg-primary w-[75%]"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">75% complete</p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/plans/1">
                <Button variant="outline" size="sm">View Plan</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Bachelor of Computer Science</CardTitle>
              <CardDescription>Created on March 1, 2025</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Major: Computer Science
                <br />
                Minor: Pure Mathematics
              </p>
              <div className="mt-4">
                <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                  <div className="h-full bg-primary w-[35%]"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">35% complete</p>
              </div>
            </CardContent>
            <CardFooter>
              <Link href="/plans/2">
                <Button variant="outline" size="sm">View Plan</Button>
              </Link>
            </CardFooter>
          </Card>
          
          <Link href="/plans/new" className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center h-[240px] hover:border-primary/50 hover:bg-muted/50 transition-colors">
            <div className="font-semibold">Create a new plan</div>
            <p className="text-sm text-muted-foreground mt-2">Start planning your academic journey</p>
          </Link>
        </div>
      </main>
      <footer className="py-6 border-t">
        <div className="container flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} WatPlan
          </p>
        </div>
      </footer>
    </div>
  );
}