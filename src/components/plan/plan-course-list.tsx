"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, XIcon, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CourseWithStatus, AcademicTerm, CoopSequence as CoopSequenceType } from "@/types";
import { updatePlanCourse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PlanCourseListProps {
  courses: CourseWithStatus[];
}

// Define the academic terms in order
const defaultTerms: AcademicTerm[] = [
  "1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"
];

// Co-op sequences mapping for display
const coopSequenceMap: Record<string, string> = {
  NO_COOP: "No Co-op",
  SEQUENCE_1: "Sequence 1",
  SEQUENCE_2: "Sequence 2",
  SEQUENCE_3: "Sequence 3",
  SEQUENCE_4: "Sequence 4",
  CUSTOM: "Custom",
};

export function PlanCourseList({ courses: initialCourses }: PlanCourseListProps) {
  const params = useParams();
  const planId = params.id as string;
  const [sequence, setSequence] = useState<CoopSequenceType>("NO_COOP");
  const [courses, setCourses] = useState<CourseWithStatus[]>(initialCourses);
  const [draggedCourse, setDraggedCourse] = useState<CourseWithStatus | null>(null);
  const { toast } = useToast();
  
  // Function to handle drag start
  const handleDragStart = (e: React.DragEvent, course: CourseWithStatus) => {
    e.dataTransfer.setData("courseId", course.id);
    setDraggedCourse(course);
    
    // Highlight all droppable columns when dragging starts
    document.querySelectorAll('.term-column').forEach(el => {
      (el as HTMLElement).classList.add('term-column-droppable');
    });
    
    // Create a custom drag image that looks better
    if (e.dataTransfer.setDragImage) {
      const elem = document.createElement('div');
      elem.classList.add('drag-ghost');
      elem.style.position = "absolute";
      elem.style.width = `${e.currentTarget.offsetWidth}px`;
      elem.style.padding = "12px";
      elem.style.background = "white";
      elem.style.borderRadius = "6px";
      elem.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.1)";
      elem.style.pointerEvents = "none";
      elem.style.opacity = "0.9";
      elem.style.zIndex = "9999";
      
      // Add content to the drag ghost
      const titleEl = document.createElement('div');
      titleEl.style.fontWeight = "600";
      titleEl.textContent = `${course.courseCode} ${course.catalogNumber}`;
      
      const descEl = document.createElement('div');
      descEl.style.fontSize = "0.875rem";
      descEl.style.opacity = "0.7";
      descEl.textContent = course.title;
      
      elem.appendChild(titleEl);
      elem.appendChild(descEl);
      
      document.body.appendChild(elem);
      
      // Position at cursor
      e.dataTransfer.setDragImage(elem, 20, 20);
      
      // Remove after drag starts
      setTimeout(() => {
        document.body.removeChild(elem);
      }, 0);
    }
  };
  
  // Function to handle drop
  const handleDrop = async (e: React.DragEvent, targetTerm: string, targetPosition?: number) => {
    e.preventDefault();
    e.currentTarget.classList.remove('term-column-drag-over');
    
    // Remove highlighting from all droppable areas
    document.querySelectorAll('.term-column').forEach(el => {
      (el as HTMLElement).classList.remove('term-column-droppable');
    });
    
    const courseId = e.dataTransfer.getData("courseId");
    console.log(`Move course ${courseId} to term ${targetTerm}`);
    
    // Find the course in the current courses
    const draggedCourse = courses.find(c => c.id === courseId);
    if (!draggedCourse) return;
    
    // If dropping in same term and we have position info, this is a reorder
    if (draggedCourse.term === targetTerm && targetPosition !== undefined) {
      // Reorder courses within the same term
      const termCourses = [...coursesByTerm[targetTerm]];
      const currentIndex = termCourses.findIndex(c => c.id === courseId);
      
      // Remove from current position
      if (currentIndex !== -1) {
        const [removed] = termCourses.splice(currentIndex, 1);
        
        // Insert at new position, accounting for the removed item
        const newPosition = targetPosition > currentIndex ? targetPosition - 1 : targetPosition;
        termCourses.splice(newPosition, 0, removed);
        
        // Update all courses
        const newCourses = [...courses];
        for (let i = 0; i < courses.length; i++) {
          if (courses[i].term === targetTerm) {
            newCourses.splice(i, 1);
          }
        }
        newCourses.push(...termCourses);
        setCourses(newCourses);
        return;
      }
    }
    
    // If we're just dropping in the same term with no position change, do nothing
    if (draggedCourse.term === targetTerm && targetPosition === undefined) return;
    
    // Update the local state immediately for a responsive feel
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course.id === courseId 
          ? { ...course, term: targetTerm, justDropped: true } 
          : course
      )
    );
    
    // Remove the justDropped flag after animation completes
    setTimeout(() => {
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, justDropped: false } 
            : course
        )
      );
    }, 600);
    
    try {
      // Call the API to update the course term
      const response = await updatePlanCourse(planId, courseId, { term: targetTerm });
      
      if (response.error) {
        // If there's an error, revert the local state
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === courseId 
              ? { ...course, term: draggedCourse.term } 
              : course
          )
        );
        
        toast({
          title: "Error",
          description: `Failed to update course term: ${response.error}`,
          variant: "destructive",
        });
      } else {
        // Success toast (optional)
        toast({
          title: "Success",
          description: `Moved ${draggedCourse.courseCode} ${draggedCourse.catalogNumber} to ${targetTerm}`,
        });
      }
    } catch (error) {
      console.error('Error updating course term:', error);
      // Revert the local state on error
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { ...course, term: draggedCourse.term } 
            : course
        )
      );
      
      toast({
        title: "Error",
        description: `Failed to update course term: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setDraggedCourse(null);
    }
  };
  
  // Allow drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Remove highlighting when drag ends
  const handleDragEnd = () => {
    document.querySelectorAll('.term-column').forEach(el => {
      (el as HTMLElement).classList.remove('term-column-droppable');
      (el as HTMLElement).classList.remove('term-column-drag-over');
    });
    setDraggedCourse(null);
  };
  
  // Group courses by term
  const coursesByTerm = useMemo(() => {
    const grouped: Record<string, CourseWithStatus[]> = {};
    
    // Initialize all default terms with empty arrays
    defaultTerms.forEach(term => {
      grouped[term] = [];
    });
    
    // Add any other terms found in courses
    courses.forEach((course) => {
      const term = course.term || 'Unscheduled';
      if (!grouped[term]) {
        grouped[term] = [];
      }
      grouped[term].push(course);
    });
    
    return grouped;
  }, [courses]);
  
  const getStatusBadge = (status: CourseWithStatus["status"]) => {
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
    <div className="space-y-8">
      {/* CSS for drag and drop styling */}
      <style jsx global>{`
        .term-column-droppable {
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          background-color: rgba(0, 0, 0, 0.01);
          box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.05);
        }
        
        .term-column-drag-over {
          background-color: rgba(0, 0, 0, 0.03);
          box-shadow: inset 0 0 0 2px var(--primary);
          transform: translateY(-2px);
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        .course-item {
          cursor: grab;
          transition: all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
          position: relative;
          backface-visibility: hidden;
          transform-origin: 50% 50%;
        }
        
        .course-item:active {
          cursor: grabbing;
        }
        
        .course-item-dragging {
          opacity: 0.4;
          transform: scale(0.98);
          background-color: rgba(0, 0, 0, 0.02);
        }
        
        .drag-ghost {
          border: 1px solid rgba(0, 0, 0, 0.1);
          z-index: 9999;
        }
        
        .course-item-drag-over {
          background-color: rgba(29, 78, 216, 0.05);
          box-shadow: 0 -2px 0 var(--primary) inset;
        }

        @keyframes dropAnimation {
          0% {
            transform: translateY(-8px) scale(1.02);
            opacity: 0.8;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
          }
          50% {
            transform: translateY(2px) scale(1);
          }
          75% {
            transform: translateY(-1px) scale(1);
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
            box-shadow: none;
          }
        }
        
        .course-item-dropped {
          animation: dropAnimation 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <h3 className="font-medium mb-2">Co-op Sequence</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(coopSequenceMap).map(([key, label]) => (
              <Button 
                key={key} 
                variant={sequence === key ? "default" : "outline"} 
                size="sm"
                onClick={() => setSequence(key as CoopSequenceType)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-medium mb-2">Program Information</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">Select Faculty</Button>
            <Button variant="outline" size="sm">Add Major</Button>
            <Button variant="outline" size="sm">Add Minor</Button>
            <Button variant="outline" size="sm">Add Option</Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {defaultTerms.map((term) => (
            <div 
              key={term}
              className="w-72 flex-shrink-0 border rounded-md bg-card term-column transition-all duration-200 ease-in-out" 
              onDrop={(e) => handleDrop(e, term)} 
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('term-column-drag-over');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('term-column-drag-over');
              }}
              onDragExit={(e) => {
                e.currentTarget.classList.remove('term-column-drag-over');
              }}
            >
              <div className="p-3 border-b bg-muted/50 font-medium flex justify-between items-center">
                <span>{term}</span>
                <Link href={`/plans/${planId}/add-course?term=${term}`}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="divide-y">
                {coursesByTerm[term]?.map((course, index) => (
                  <div 
                    key={course.id} 
                    className={`p-3 hover:bg-muted/50 transition-colors course-item ${course.justDropped ? 'course-item-dropped' : ''}`}
                    draggable 
                    onDragStart={(e) => {
                      handleDragStart(e, course);
                      e.currentTarget.classList.add('course-item-dragging');
                    }}
                    onDragEnd={(e) => {
                      e.currentTarget.classList.remove('course-item-dragging');
                      handleDragEnd();
                    }}
                    // Add handlers for reordering within the same term
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.add('course-item-drag-over');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('course-item-drag-over');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      e.currentTarget.classList.remove('course-item-drag-over');
                      // Call handleDrop with the index for positioning
                      handleDrop(e, term, index);
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-medium">{course.courseCode} {course.catalogNumber}</div>
                      {getStatusBadge(course.status)}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{course.title}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm">
                        {course.units} units
                        {course.grade && <span className="ml-2">Grade: {course.grade}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <PencilIcon className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {(!coursesByTerm[term] || coursesByTerm[term].length === 0) && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <p>No courses added</p>
                    <Link href={`/plans/${planId}/add-course?term=${term}`}>
                      <Button variant="ghost" size="sm" className="mt-2">
                        Add a course
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Display unscheduled courses if any */}
      {coursesByTerm['Unscheduled'] && coursesByTerm['Unscheduled'].length > 0 && (
        <div className="border rounded-md term-column" 
             onDrop={(e) => handleDrop(e, 'Unscheduled')}
             onDragOver={(e) => {
               e.preventDefault();
               e.currentTarget.classList.add('term-column-drag-over');
             }}
             onDragLeave={(e) => {
               e.currentTarget.classList.remove('term-column-drag-over');
             }}
             onDragExit={(e) => {
               e.currentTarget.classList.remove('term-column-drag-over');
             }}>
          <div className="p-3 border-b bg-muted/50 font-medium">
            Unscheduled Courses
          </div>
          <div className="divide-y">
            {coursesByTerm['Unscheduled'].map((course, index) => (
              <div 
                key={course.id} 
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/50 transition-colors course-item ${course.justDropped ? 'course-item-dropped' : ''}`}
                draggable 
                onDragStart={(e) => {
                  handleDragStart(e, course);
                  e.currentTarget.classList.add('course-item-dragging');
                }}
                onDragEnd={(e) => {
                  e.currentTarget.classList.remove('course-item-dragging');
                  handleDragEnd();
                }}
                // Add handlers for reordering within Unscheduled
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.add('course-item-drag-over');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('course-item-drag-over');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.currentTarget.classList.remove('course-item-drag-over');
                  handleDrop(e, 'Unscheduled', index);
                }}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{course.courseCode} {course.catalogNumber}</div>
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
      )}
    </div>
  );
}