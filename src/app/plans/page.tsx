"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getPlans, deletePlan } from "@/lib/api";
import { Plan } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const { toast } = useToast();

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

  useEffect(() => {
    fetchPlans();
  }, [toast]);
  
  const handleDelete = async () => {
    if (!planToDelete) return;
    
    setIsDeleting(true);
    
    // Optimistically update UI
    setPlans(prev => prev.filter(p => p.id !== planToDelete.id));
    
    const response = await deletePlan(planToDelete.id);
    setIsDeleting(false);
    setPlanToDelete(null);
    
    if (response.error) {
      // If error, revert the optimistic update
      fetchPlans();
      toast({
        title: "Error",
        description: `Failed to delete plan: ${response.error}`,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Success",
      description: `Plan "${planToDelete.name}" has been deleted`,
    });
  };

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
              <AnimatePresence mode="popLayout">
                {plans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.9,
                      transition: { duration: 0.2 }
                    }}
                    transition={{ 
                      duration: 0.3,
                      type: "spring",
                      stiffness: 500,
                      damping: 30
                    }}
                    layout
                  >
                    <Card className="overflow-hidden hover:shadow-md relative group h-full">
                      <div className="h-2 bg-primary"></div>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setPlanToDelete(plan);
                        }}
                        className="absolute right-3 top-3 p-1.5 rounded-full bg-muted/80 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
                        aria-label={`Delete ${plan.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
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
                                {planDegree.type}: {planDegree.degree.program?.name || planDegree.degree.name}
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
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Always show the "Create New Plan" card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                layout
              >
                <Link 
                  href="/plans/new" 
                  className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center h-[240px] hover:border-primary/50 hover:bg-muted/50 transition-colors animate-pulse-slow block h-full"
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
              </motion.div>
              
              {/* If no plans and not loading, show a message */}
              {plans.length === 0 && !isLoading && (
                <motion.div 
                  className="col-span-2 flex items-center justify-center p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-muted-foreground text-center">
                    You don't have any plans yet. Create your first plan to get started!
                  </p>
                </motion.div>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!planToDelete} onOpenChange={(open) => !open && setPlanToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{planToDelete?.name}</span>?
              This action cannot be undone and all associated courses and program data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPlanToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-1 items-center"
            >
              {isDeleting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}