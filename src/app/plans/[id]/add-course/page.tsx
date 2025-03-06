"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getCourses, addCourseToPlan, updateAllPlanRequirements } from "@/lib/api";
import { Course } from "@/types";
import { CheckCircle2Icon, XIcon } from "lucide-react";

export default function AddCoursePage() {
  const params = useParams();
  const planId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [term, setTerm] = useState("");
  const [termIndex, setTermIndex] = useState<number | undefined>(undefined);
  
  // Get term query parameter from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const termParam = searchParams.get('term');
    if (termParam) {
      // Check if the term includes an index (format: "term-index")
      const [baseTerm, index] = termParam.split('-');
      setTerm(baseTerm);
      if (index) {
        setTermIndex(parseInt(index));
      }
    }
  }, []);

  // Search for courses with debounce
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setCourses([]);
      return;
    }

    setIsLoading(true);
    const response = await getCourses({ courseCode: query });
    setIsLoading(false);

    if (response.error) {
      toast({
        title: "Error",
        description: `Failed to search courses: ${response.error}`,
        variant: "destructive",
      });
      return;
    }

    if (response.data) {
      setCourses(response.data.courses);
    }
  };
  
  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      }
    }, 300); // 300ms delay for debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Add multiple courses to plan
  const handleAddCourses = async () => {
    if (selectedCourses.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one course",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdding(true);
      
      // Add each selected course sequentially
      const results = [];
      const failures = [];
      
      for (const course of selectedCourses) {
        try {
          const response = await addCourseToPlan(planId, {
            courseId: course.id,
            term: term || undefined,
            termIndex: termIndex,
            status: "PLANNED"
          });

          if (response.error) {
            failures.push({
              course,
              error: response.error
            });
          } else {
            results.push(course);
          }
        } catch (error) {
          failures.push({
            course,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      // Show appropriate toast based on results
      if (results.length > 0) {
        toast({
          title: "Success",
          description: `Added ${results.length} course${results.length > 1 ? 's' : ''} to your plan`,
        });
      }
      
      // Show errors for failed courses
      if (failures.length > 0) {
        const duplicateErrors = failures.filter(f => f.error.includes("already in plan"));
        const otherErrors = failures.filter(f => !f.error.includes("already in plan"));
        
        if (duplicateErrors.length > 0) {
          toast({
            title: "Some Courses Already in Plan",
            description: `${duplicateErrors.length} course${duplicateErrors.length > 1 ? 's were' : ' was'} already in your plan.`,
            variant: "destructive",
          });
        }
        
        if (otherErrors.length > 0) {
          toast({
            title: "Error Adding Some Courses",
            description: `Failed to add ${otherErrors.length} course${otherErrors.length > 1 ? 's' : ''}. Please try again.`,
            variant: "destructive",
          });
        }
      }

      // Update requirements before returning to plan detail
      if (results.length > 0) {
        try {
          // Update all requirements for the plan
          await updateAllPlanRequirements(planId);
        } catch (error) {
          console.error("Error updating requirements:", error);
        }
        
        // Navigate back to plan detail
        router.push(`/plans/${planId}`);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add courses to plan",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Add Course to Plan</CardTitle>
              <CardDescription>
                Search for courses by course code or title
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., MATH, CS135, PMATH 333, Calculus"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    // No need for onKeyDown as search is triggered by the onChange debounce
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleSearch(searchQuery)} 
                    disabled={isLoading}
                  >
                    {isLoading ? "Searching..." : "Search"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Search by course code (e.g., MATH, PMATH), specific course (e.g., CS135, PMATH 333), or keywords
                </p>
              </div>

              {isLoading ? (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">Searching courses...</p>
                </div>
              ) : courses.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Search Results</h3>
                  <div className="border rounded-md divide-y max-h-[400px] overflow-y-auto">
                    {courses.map((course) => (
                      <div 
                        key={course.id} 
                        className={`p-4 cursor-pointer ${
                          selectedCourses.some(c => c.id === course.id) ? 
                          'bg-primary/10 border-l-4 border-l-primary' : 
                          'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          // Toggle course selection
                          setSelectedCourses(prev => {
                            const isSelected = prev.some(c => c.id === course.id);
                            return isSelected 
                              ? prev.filter(c => c.id !== course.id) 
                              : [...prev, course];
                          })
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {course.courseCode} {course.catalogNumber}: {course.title}
                            </div>
                            <Badge className="mt-1 bg-muted text-foreground hover:bg-muted">
                              {course.units} units
                            </Badge>
                          </div>
                          {selectedCourses.some(c => c.id === course.id) && (
                            <CheckCircle2Icon className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        {course.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">
                    {searchQuery.trim() ? 
                      "No courses found matching your search criteria" : 
                      "Search for courses to add to your plan"
                    }
                  </p>
                </div>
              )}

              {selectedCourses.length > 0 && (
                <div className="border rounded-md p-4 bg-muted/30">
                  <h3 className="text-sm font-medium mb-2">Selected Courses ({selectedCourses.length})</h3>
                  <div className="mb-4 max-h-[150px] overflow-y-auto">
                    {selectedCourses.map(course => (
                      <div key={course.id} className="py-1 flex justify-between items-center">
                        <p className="text-sm font-medium">
                          {course.courseCode} {course.catalogNumber}: {course.title}
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            setSelectedCourses(prev => prev.filter(c => c.id !== course.id));
                          }}
                        >
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <label htmlFor="term" className="text-sm font-medium">
                      Term (Optional)
                    </label>
                    <Input
                      id="term"
                      placeholder="e.g., Fall 2025"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => router.push(`/plans/${planId}`)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddCourses} 
                disabled={selectedCourses.length === 0 || isAdding}
              >
                {isAdding ? "Adding..." : `Add ${selectedCourses.length > 0 ? selectedCourses.length : ''} to Plan`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}