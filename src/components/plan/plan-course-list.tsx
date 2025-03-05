"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, PencilIcon, XIcon } from "lucide-react";

type Course = {
  id: string;
  code: string;
  catalogNumber: string;
  title: string;
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED";
  term: string;
  grade?: string;
};

interface PlanCourseListProps {
  courses: Course[];
}

export function PlanCourseList({ courses }: PlanCourseListProps) {
  // Group courses by term
  const coursesByTerm: Record<string, Course[]> = {};
  
  courses.forEach((course) => {
    if (!coursesByTerm[course.term]) {
      coursesByTerm[course.term] = [];
    }
    coursesByTerm[course.term].push(course);
  });
  
  // Sort terms in reverse chronological order
  const sortedTerms = Object.keys(coursesByTerm).sort().reverse();
  
  const getStatusBadge = (status: Course["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case "PLANNED":
        return <Badge variant="outline">Planned</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      {sortedTerms.map((term) => (
        <div key={term}>
          <h3 className="font-medium text-lg mb-3">{term}</h3>
          <div className="border rounded-md divide-y">
            {coursesByTerm[term].map((course) => (
              <div key={course.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{course.code} {course.catalogNumber}</div>
                    {getStatusBadge(course.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">{course.title}</div>
                  {course.grade && (
                    <div className="text-sm mt-1">Grade: {course.grade}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                  <Button variant="ghost" size="icon">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}