"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getCourses, addCourseToPlan } from "@/lib/api";
import { Course } from "@/types";

export default function AddCoursePage() {
  const params = useParams();
  const planId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [term, setTerm] = useState("");
  
  // Get term query parameter from URL if present
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const termParam = searchParams.get('term');
    if (termParam) {
      setTerm(termParam);
    }
  }, []);

  // Search for courses
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    const response = await getCourses({ courseCode: searchQuery });
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

  // Add course to plan
  const handleAddCourse = async () => {
    if (!selectedCourse) {
      toast({
        title: "Error",
        description: "Please select a course",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsAdding(true);
      
      const response = await addCourseToPlan(planId, {
        courseId: selectedCourse.id,
        term: term || undefined,
        status: "PLANNED"
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Success",
        description: `Added ${selectedCourse.courseCode} ${selectedCourse.catalogNumber} to your plan`,
      });

      // Navigate back to plan detail
      router.push(`/plans/${planId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add course to plan",
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
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., MATH, CS135, Calculus"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading}
                >
                  {isLoading ? "Searching..." : "Search"}
                </Button>
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
                          selectedCourse?.id === course.id ? 
                          'bg-primary/10 border-l-4 border-l-primary' : 
                          'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedCourse(
                          selectedCourse?.id === course.id ? null : course
                        )}
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

              {selectedCourse && (
                <div className="border rounded-md p-4 bg-muted/30">
                  <h3 className="text-sm font-medium mb-2">Selected Course</h3>
                  <p className="font-medium">
                    {selectedCourse.courseCode} {selectedCourse.catalogNumber}: {selectedCourse.title}
                  </p>
                  
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
                onClick={handleAddCourse} 
                disabled={!selectedCourse || isAdding}
              >
                {isAdding ? "Adding..." : "Add to Plan"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
}