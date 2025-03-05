"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createPlan } from "@/lib/api";

export default function NewPlanPage() {
  const [planName, setPlanName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!planName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a plan name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      
      // Call the API to create a new plan
      const response = await createPlan({ name: planName });
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      toast({
        title: "Success",
        description: "Plan created successfully",
      });
      
      // Redirect to the plans listing page
      router.push("/plans");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create plan",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create a New Degree Plan</CardTitle>
              <CardDescription>
                Start planning your academic journey at UWaterloo
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreatePlan}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="plan-name" className="text-sm font-medium">
                    Plan Name
                  </label>
                  <Input 
                    id="plan-name"
                    placeholder="e.g., My CS Degree Plan" 
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push("/plans")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Plan"}
                </Button>
              </CardFooter>
            </form>
          </Card>
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