"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getCourses } from "@/lib/api";
import { Course } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subjects, setSubjects] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Fetch courses on initial load
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      const response = await getCourses({ limit: 50 });
      setIsLoading(false);
      
      if (response.error) {
        toast({
          title: "Error",
          description: `Failed to load courses: ${response.error}`,
          variant: "destructive",
        });
        return;
      }
      
      if (response.data) {
        setCourses(response.data.courses);
        
        // Extract unique subjects
        const subjectList = Array.from(
          new Set(response.data.courses.map((course) => course.courseCode))
        ).sort();
        setSubjects(subjectList);
      }
    };
    
    fetchCourses();
  }, [toast]);
  
  // Filter courses based on search term and subject filter
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      (course.courseCode + " " + course.catalogNumber).toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !filterSubject || course.courseCode === filterSubject;
    
    return matchesSearch && matchesSubject;
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Course Catalog</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-3">
            <div className="relative">
              <Input
                placeholder="Search for courses by code or title (e.g. MATH 135, Linear Algebra)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-4 pr-10"
              />
            </div>
          </div>
          <div>
            <select 
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
              value={filterSubject || ""}
              onChange={(e) => setFilterSubject(e.target.value || null)}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Loading courses...</p>
            </div>
          ) : (
            <>
              {filteredCourses.map((course) => (
                <Card key={course.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {course.courseCode} {course.catalogNumber}: {course.title}
                        </CardTitle>
                        <Badge className="mt-1 bg-muted text-foreground hover:bg-muted">
                          {course.units} units
                        </Badge>
                      </div>
                      <Link href={`/courses/${course.courseCode}${course.catalogNumber}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{course.description || "No description available."}</p>
                    
                    {course.prerequisites && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground"><span className="font-medium">Prerequisites:</span> {course.prerequisites}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {filteredCourses.length === 0 && !isLoading && (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No courses found matching your criteria</p>
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