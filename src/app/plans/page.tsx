"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlans } from "@/lib/api";
import { Plan } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoading(true);
      const response = await getPlans();
      setIsLoading(false);

      if (response.error) {
        toast({
          title: "Error",
          description: `Failed to load plans: ${response.error}`,
          variant: "destructive",
        });
        return;
      }

      if (response.data) {
        setPlans(response.data.plans);
      }
    };

    fetchPlans();
  }, [toast]);

  // Calculate progress for each plan
  const calculateProgress = (plan: Plan) => {
    if (!plan.courses || plan.courses.length === 0) return 0;
    
    const completedCourses = plan.courses.filter(
      course => course.status === 'COMPLETED'
    ).length;
    
    return Math.round((completedCourses / plan.courses.length) * 100);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
          {isLoading ? (
            <div className="col-span-full text-center p-12">
              <p className="text-muted-foreground">Loading plans...</p>
            </div>
          ) : (
            <>
              {plans.map((plan) => (
                <Card key={plan.id} className="overflow-hidden transition-all hover:shadow-md">
                  <div className="h-2 bg-primary"></div>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{plan.name}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {plan.courses ? `${plan.courses.length} courses` : "0 courses"}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Created on {formatDate(plan.created)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {plan.degrees && plan.degrees.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {plan.degrees.map((planDegree) => (
                          <span key={planDegree.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                            {planDegree.type}: {planDegree.degree.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mb-4">
                        No degrees added yet
                      </p>
                    )}
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{calculateProgress(plan)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                        <div 
                          className="h-full bg-primary transition-all duration-500" 
                          style={{ width: `${calculateProgress(plan)}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/10">
                    <Link href={`/plans/${plan.id}`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full">View Plan</Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}

              {/* Always show the "Create New Plan" card */}
              <Link 
                href="/plans/new" 
                className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center h-[240px] hover:border-primary/50 hover:bg-muted/50 transition-colors animate-pulse-slow"
              >
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <div className="font-semibold text-lg">Create a new plan</div>
                <p className="text-sm text-muted-foreground mt-2">
                  Start planning your academic journey
                </p>
              </Link>
              
              {/* If no plans and not loading, show a message */}
              {plans.length === 0 && !isLoading && (
                <div className="col-span-2 flex items-center justify-center p-6">
                  <p className="text-muted-foreground text-center">
                    You don't have any plans yet. Create your first plan to get started!
                  </p>
                </div>
              )}
            </>
          )}
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