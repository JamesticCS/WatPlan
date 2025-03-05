"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, XIcon, PlusIcon, AlertTriangleIcon } from "lucide-react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CourseWithStatus, AcademicTerm, CoopSequence as CoopSequenceType } from "@/types";
import { updatePlanCourse, removeCourseFromPlan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface PlanCourseListProps {
  courses: CourseWithStatus[];
}

// Define the academic terms in order
const defaultTerms: AcademicTerm[] = [
  "1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"
];

// Example co-op sequence patterns (will be dynamically generated based on selection)
const coopSequencePatterns: Record<CoopSequenceType, AcademicTerm[]> = {
  NO_COOP: ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"],
  SEQUENCE_1: ["1A", "1B", "COOP", "2A", "COOP", "2B", "3A", "COOP", "3B", "COOP", "4A", "4B"],
  SEQUENCE_2: ["1A", "COOP", "1B", "2A", "COOP", "2B", "COOP", "3A", "3B", "COOP", "4A", "4B"],
  SEQUENCE_3: ["1A", "1B", "2A", "COOP", "2B", "COOP", "3A", "COOP", "3B", "4A", "COOP", "4B"],
  SEQUENCE_4: ["1A", "1B", "COOP", "2A", "2B", "COOP", "3A", "COOP", "3B", "COOP", "4A", "4B"],
  CUSTOM: ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"] // Custom can be modified by the user
};

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingSequence, setPendingSequence] = useState<CoopSequenceType | null>(null);
  const { toast } = useToast();
  
  // Function to handle drag start
  const handleDragStart = (e: React.DragEvent, course: CourseWithStatus) => {
    // Store course ID for drop handling
    e.dataTransfer.setData("courseId", course.id);
    setDraggedCourse(course);
    
    // Set effectAllowed to move to indicate we're moving, not copying
    e.dataTransfer.effectAllowed = "move";
    
    // Highlight all droppable columns when dragging starts
    document.querySelectorAll('.term-column').forEach(el => {
      (el as HTMLElement).classList.add('term-column-droppable');
    });
    
    // Create a custom drag image that looks better
    if (e.dataTransfer.setDragImage) {
      // Create drag ghost element
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
      elem.style.top = "-1000px"; // Position off-screen initially
      
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
      
      // Add to document
      document.body.appendChild(elem);
      
      // Calculate better offset based on cursor position within the element
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      
      // Position drag image at cursor with appropriate offset
      // This helps prevent "jumping" when dragging starts
      e.dataTransfer.setDragImage(elem, offsetX, offsetY);
      
      // Remove after drag starts
      setTimeout(() => {
        if (document.body.contains(elem)) {
          document.body.removeChild(elem);
        }
      }, 10);
    }
  };
  
  // Function to handle drop
  const handleDrop = async (e: React.DragEvent, targetTermId: string, targetPosition?: number) => {
    e.preventDefault();
    if (e.currentTarget) {
      e.currentTarget.classList.remove('term-column-drag-over');
    }
    
    // Remove highlighting from all droppable areas
    document.querySelectorAll('.term-column').forEach(el => {
      (el as HTMLElement).classList.remove('term-column-droppable');
    });
    
    const courseId = e.dataTransfer.getData("courseId");
    if (!courseId) {
      console.error('No course ID in drop data');
      return;
    }
    
    // Store the draggedCourse reference locally instead of depending on state
    // This prevents potential "Cannot update during an existing state transition" errors
    const localDraggedCourse = courses.find(c => c.id === courseId);
    if (!localDraggedCourse) {
      console.error('Course not found:', courseId);
      return;
    }
    
    // Extract the base term name and index from targetTermId (format: "term-index")
    const [targetTerm, targetTermIndex] = targetTermId.split('-');
    
    // Get current unique term id for the dragged course
    const currentTermId = localDraggedCourse.termIndex !== undefined 
      ? `${localDraggedCourse.term}-${localDraggedCourse.termIndex}` 
      : localDraggedCourse.term;
    
    // If dropping in same term and we have position info, this is a reorder
    if (currentTermId === targetTermId && targetPosition !== undefined) {
      // Reorder courses within the same term
      const termCourses = [...coursesByTerm[targetTermId]];
      const currentIndex = termCourses.findIndex(c => c.id === courseId);
      
      // Remove from current position
      if (currentIndex !== -1) {
        const [removed] = termCourses.splice(currentIndex, 1);
        
        // Insert at new position, accounting for the removed item
        const newPosition = targetPosition > currentIndex ? targetPosition - 1 : targetPosition;
        termCourses.splice(newPosition, 0, removed);
        
        // Update all courses (reorder only)
        const newCourses = courses.filter(course => 
          course.id !== courseId || 
          (course.term !== localDraggedCourse.term && course.termIndex !== localDraggedCourse.termIndex)
        );
        newCourses.push(...termCourses);
        setCourses(newCourses);
        return;
      }
    }
    
    // If we're just dropping in the same term with no position change, do nothing
    if (currentTermId === targetTermId && targetPosition === undefined) return;
    
    // Check if there is already a course with the same ID or the same course code + catalog number in the target term
    // This prevents duplicating the same course in a term
    const duplicateCourses = courses.filter(course => 
      course.id !== courseId && // Not the course we're moving
      ((course.courseCode === localDraggedCourse.courseCode && 
        course.catalogNumber === localDraggedCourse.catalogNumber) ||
        course.id === localDraggedCourse.id) && // Check both course ID and course code+catalog
      course.term === targetTerm && 
      course.termIndex === parseInt(targetTermIndex)
    );
    
    if (duplicateCourses.length > 0) {
      toast({
        title: "Cannot move course",
        description: `${localDraggedCourse.courseCode} ${localDraggedCourse.catalogNumber} is already in this term`,
        variant: "destructive",
      });
      return;
    }
    
    // Update the local state immediately for a responsive feel
    setCourses(prevCourses => 
      prevCourses.map(course => 
        course.id === courseId 
          ? { 
              ...course, 
              term: targetTerm,
              termIndex: parseInt(targetTermIndex), 
              justDropped: true 
            } 
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
      // Call the API to update the course term, including the term index for uniqueness
      const response = await updatePlanCourse(planId, courseId, { 
        term: targetTerm,
        termIndex: parseInt(targetTermIndex)
      });
      
      if (response.error) {
        // If there's an error, revert the local state
        setCourses(prevCourses => 
          prevCourses.map(course => 
            course.id === courseId 
              ? { 
                  ...course, 
                  term: draggedCourse.term,
                  termIndex: draggedCourse.termIndex 
                } 
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
        const termDisplay = targetTerm === "COOP" 
          ? `Co-op Work Term ${activeTerms.slice(0, parseInt(targetTermIndex)).filter(t => t === "COOP").length + 1}` 
          : targetTerm;
        
        toast({
          title: "Success",
          description: `Moved ${localDraggedCourse.courseCode} ${localDraggedCourse.catalogNumber} to ${termDisplay}`,
        });
      }
    } catch (error) {
      console.error('Error updating course term:', error);
      // Revert the local state on error
      setCourses(prevCourses => 
        prevCourses.map(course => 
          course.id === courseId 
            ? { 
                ...course, 
                term: localDraggedCourse.term,
                termIndex: localDraggedCourse.termIndex 
              } 
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
  
  // Get terms based on selected sequence
  const activeTerms = useMemo(() => {
    return coopSequencePatterns[sequence];
  }, [sequence]);

  // Generate unique term IDs for each term in the sequence
  const termIds = useMemo(() => {
    return activeTerms.map((term, index) => ({
      term,
      id: `${term}-${index}`
    }));
  }, [activeTerms]);

  // Group courses by term with unique COOP terms
  const coursesByTerm = useMemo(() => {
    const grouped: Record<string, CourseWithStatus[]> = {};
    
    // Initialize all active terms with empty arrays
    termIds.forEach(({ term, id }) => {
      grouped[id] = [];
    });
    
    // Initialize Unscheduled group
    grouped['Unscheduled'] = [];
    
    // Add any other terms found in courses
    courses.forEach((course) => {
      if (!course.term || course.term === 'Unscheduled') {
        // Handle unscheduled courses
        grouped['Unscheduled'].push(course);
      } else {
        // Create unique term identifier based on term and termIndex
        const uniqueTermId = course.termIndex !== undefined
          ? `${course.term}-${course.termIndex}`
          : null;
          
        // First check if we have an exact match for the term with its index
        if (uniqueTermId && Object.keys(grouped).includes(uniqueTermId)) {
          grouped[uniqueTermId].push(course);
        } else {
          // If no exact match, find a matching term in the active terms
          const termMatch = termIds.find(({ term }) => term === course.term);
          if (termMatch) {
            grouped[termMatch.id].push(course);
            
            // Update the course's termIndex to match the found term
            // This prevents duplications by ensuring consistent termIndex
            if (course.termIndex === undefined || course.termIndex !== parseInt(termMatch.id.split('-')[1])) {
              const termParts = termMatch.id.split('-');
              const termIndex = parseInt(termParts[1]);
              
              // Update local state with correct termIndex
              setCourses(prevCourses => 
                prevCourses.map(c => 
                  c.id === course.id 
                    ? { ...c, termIndex: termIndex } 
                    : c
                )
              );
              
              // Update in backend to ensure consistency
              updatePlanCourse(planId, course.id, { 
                term: course.term,
                termIndex: termIndex
              }).catch(error => {
                console.error('Error updating course term index:', error);
              });
            }
          } else {
            // For any unmatched terms, put in Unscheduled
            grouped['Unscheduled'].push(course);
          }
        }
      }
    });
    
    // Find and report any duplicate courses in terms
    const duplicatesFound = [];
    
    Object.keys(grouped).forEach(termId => {
      if (termId === 'Unscheduled') return; // Allow duplicates in unscheduled
      
      // Track unique course identifiers 
      const courseCodes = new Map();
      
      // Find any duplicates without modifying the groups yet
      grouped[termId].forEach(course => {
        const courseIdentifier = `${course.courseCode}-${course.catalogNumber}`;
        
        if (courseCodes.has(courseIdentifier)) {
          duplicatesFound.push({
            course,
            termId,
            originalCourse: courseCodes.get(courseIdentifier)
          });
        } else {
          courseCodes.set(courseIdentifier, course);
        }
      });
    });
    
    // If duplicates were found, notify the user and fix them by moving later duplicates to unscheduled
    if (duplicatesFound.length > 0) {
      console.warn('Duplicate courses detected in terms:', duplicatesFound);
      
      // Fix each duplicate by keeping the first occurrence and moving others to unscheduled
      duplicatesFound.forEach(({course, termId}) => {
        // Remove the duplicate from its current term
        grouped[termId] = grouped[termId].filter(c => c.id !== course.id);
        
        // Move to unscheduled with its original term data
        grouped['Unscheduled'].push({
          ...course,
          justDropped: true  // Add animation effect
        });
        
        // Silently update the backend to match our UI state
        updatePlanCourse(planId, course.id, { 
          term: "Unscheduled",
          termIndex: null
        }).catch(error => {
          console.error('Error fixing duplicate course:', error);
        });
      });
      
      // Show a toast only if we found duplicates
      if (duplicatesFound.length > 0) {
        toast({
          title: "Duplicate courses detected",
          description: `${duplicatesFound.length} duplicate course${duplicatesFound.length > 1 ? 's were' : ' was'} moved to Unscheduled`,
          variant: "destructive",
        });
      }
    }
    
    return grouped;
  }, [courses, termIds, planId]);
  
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
          touch-action: none; /* Prevents default touch actions during drag */
        }
        
        .course-item:active {
          cursor: grabbing;
        }
        
        /* Fix for Safari */
        .course-item * {
          pointer-events: none;
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
        
        /* Replace the single drag-over with top and bottom variants */
        .course-item-drag-over-top {
          background-color: rgba(29, 78, 216, 0.05);
          box-shadow: 0 -2px 0 var(--primary) inset;
          position: relative;
        }
        
        .course-item-drag-over-top::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--primary);
          z-index: 5;
        }
        
        .course-item-drag-over-bottom {
          background-color: rgba(29, 78, 216, 0.05);
          box-shadow: 0 2px 0 var(--primary) inset;
          position: relative;
        }
        
        .course-item-drag-over-bottom::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--primary);
          z-index: 5;
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

        .term-header {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--foreground);
          background-color: var(--primary);
          color: var(--primary-foreground);
          padding: 0.5rem 1rem;
          border-radius: 0.375rem 0.375rem 0 0;
        }

        .terms-grid {
          display: flex;
          flex-direction: row;
          gap: 1rem;
          width: max-content;
          min-width: 100%;
          padding-bottom: 1rem;
        }
        
        .term-column {
          min-width: 250px;
          width: 250px;
          flex-shrink: 0;
        }
      `}</style>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-muted/30 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <Button 
                size="lg" 
                className="gap-2 shadow-sm font-medium"
                onClick={() => {}}
              >
                <PlusIcon className="h-4 w-4" />
                Add Program
              </Button>
              <span className="ml-2 text-sm text-muted-foreground">
                Add a major, minor, option, or specialization
              </span>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Co-op Sequence:</span>
            <select 
              className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={sequence}
              onChange={(e) => {
                const newSequence = e.target.value as CoopSequenceType;
                if (courses.some(course => course.term && course.term !== "Unscheduled")) {
                  setPendingSequence(newSequence);
                  setDialogOpen(true);
                } else {
                  setSequence(newSequence);
                }
              }}
            >
              {Object.entries(coopSequenceMap).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="w-full mb-4 pt-2 overflow-x-auto">
        <div className="terms-grid">
          {termIds.map(({ term, id }, index) => (
            <div 
              key={id}
              className="border rounded-md bg-card term-column shadow-sm" 
              onDrop={(e) => handleDrop(e, id)} 
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
              <div className="term-header flex justify-between items-center">
                <span>{term === "COOP" ? 
                  `Co-op Work Term ${activeTerms.slice(0, index).filter(t => t === "COOP").length + 1}` : 
                  term}
                </span>
                <Link href={`/plans/${planId}/add-course?term=${id}`}>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary-foreground/20">
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="divide-y">
                {coursesByTerm[id]?.map((course, courseIndex) => (
                  <div 
                    key={`${course.id}-${id}-${courseIndex}`} 
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
                    // Add handlers for reordering within the same term - showing drop zones only above/below, not on the course
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const rect = e.currentTarget.getBoundingClientRect();
                      const mouseY = e.clientY;
                      const relativeY = mouseY - rect.top;
                      
                      // Only highlight top or bottom border depending on mouse position
                      // Remove any existing highlights first
                      e.currentTarget.classList.remove('course-item-drag-over-top', 'course-item-drag-over-bottom');
                      
                      if (relativeY < rect.height / 2) {
                        e.currentTarget.classList.add('course-item-drag-over-top');
                      } else {
                        e.currentTarget.classList.add('course-item-drag-over-bottom');
                      }
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('course-item-drag-over-top', 'course-item-drag-over-bottom');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      const rect = e.currentTarget.getBoundingClientRect();
                      const mouseY = e.clientY;
                      const relativeY = mouseY - rect.top;
                      
                      e.currentTarget.classList.remove('course-item-drag-over-top', 'course-item-drag-over-bottom');
                      
                      // Determine if we're dropping above or below based on mouse position
                      const dropIndex = relativeY < rect.height / 2 
                        ? courseIndex // Drop above
                        : courseIndex + 1; // Drop below
                        
                      // Prevent setState during render by handling in the next tick
                      setTimeout(() => {
                        // Call handleDrop with the appropriate index for positioning
                        handleDrop(e, id, dropIndex);
                      }, 0);
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 cursor-pointer" 
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault(); // Prevent any unexpected behavior
                            try {
                              // Store course info before removing for use in toast
                              const courseCode = course.courseCode;
                              const catalogNumber = course.catalogNumber;
                              const courseId = course.id;
                              
                              // Remove from local state immediately for responsive UI
                              setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId));
                              
                              // Then call API to completely remove the course from the plan
                              const response = await removeCourseFromPlan(planId, courseId);
                              if (response.error) {
                                // If API fails, add the course back
                                setCourses(prevCourses => [...prevCourses, course]);
                                throw new Error(response.error);
                              }
                              
                              toast({
                                title: "Course removed",
                                description: `Removed ${courseCode} ${catalogNumber} from your plan`,
                              });
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: error instanceof Error ? error.message : "Failed to remove course",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
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
        <div className="border rounded-md term-column w-full max-w-full mt-8 shadow-sm" 
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
          <div className="term-header flex justify-between items-center">
            <span>Unscheduled Courses</span>
            <Link href={`/plans/${planId}/add-course?term=Unscheduled`}>
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary-foreground/20">
                <PlusIcon className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="divide-y">
            {coursesByTerm['Unscheduled'].map((course, index) => (
              <div 
                key={`${course.id}-Unscheduled-${index}`} 
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
                // Add handlers for reordering within Unscheduled - showing drop zones only above/below
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseY = e.clientY;
                  const relativeY = mouseY - rect.top;
                  
                  // Only highlight top or bottom border depending on mouse position
                  // Remove any existing highlights first
                  e.currentTarget.classList.remove('course-item-drag-over-top', 'course-item-drag-over-bottom');
                  
                  if (relativeY < rect.height / 2) {
                    e.currentTarget.classList.add('course-item-drag-over-top');
                  } else {
                    e.currentTarget.classList.add('course-item-drag-over-bottom');
                  }
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('course-item-drag-over-top', 'course-item-drag-over-bottom');
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseY = e.clientY;
                  const relativeY = mouseY - rect.top;
                  
                  e.currentTarget.classList.remove('course-item-drag-over-top', 'course-item-drag-over-bottom');
                  
                  // Determine if we're dropping above or below based on mouse position
                  const dropIndex = relativeY < rect.height / 2 
                    ? index // Drop above
                    : index + 1; // Drop below
                    
                  // Prevent setState during render by handling in the next tick
                  setTimeout(() => {
                    handleDrop(e, 'Unscheduled', dropIndex);
                  }, 0);
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
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="cursor-pointer"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault(); // Prevent any unexpected behavior
                      try {
                        // Store course info before removing for use in toast
                        const courseCode = course.courseCode;
                        const catalogNumber = course.catalogNumber;
                        const courseId = course.id;
                        
                        // Remove from local state immediately for responsive UI
                        setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId));
                        
                        // Then call API to completely remove the course from the plan
                        const response = await removeCourseFromPlan(planId, courseId);
                        if (response.error) {
                          // If API fails, add the course back
                          setCourses(prevCourses => [...prevCourses, course]);
                          throw new Error(response.error);
                        }
                        
                        toast({
                          title: "Course removed",
                          description: `Removed ${courseCode} ${catalogNumber} from your plan`,
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to remove course",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setPendingSequence(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
              Change Co-op Sequence?
            </DialogTitle>
            <DialogDescription>
              Changing your co-op sequence will remove all courses from your schedule. You'll need to
              redistribute them according to your new sequence pattern.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium text-muted-foreground">
              New co-op sequence: <span className="font-bold text-foreground">{pendingSequence ? coopSequenceMap[pendingSequence] : ''}</span>
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setPendingSequence(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={async () => {
                if (pendingSequence) {
                  // Move all scheduled courses to unscheduled and update the backend
                  const scheduledCourses = courses.filter(c => c.term && c.term !== "Unscheduled");
                  
                  // Update local state immediately for responsiveness
                  setCourses(prev => 
                    prev.map(course => ({
                      ...course,
                      term: course.term && course.term !== "Unscheduled" ? "Unscheduled" : course.term
                    }))
                  );
                  
                  // Update sequence first
                  setSequence(pendingSequence);
                  setDialogOpen(false);
                  setPendingSequence(null);
                  
                  // Then update each course in the backend
                  const updatePromises = scheduledCourses.map(course => 
                    updatePlanCourse(planId, course.id, { term: "Unscheduled" })
                  );
                  
                  try {
                    await Promise.all(updatePromises);
                    toast({
                      title: "Co-op sequence updated",
                      description: "All courses have been moved to unscheduled. Please redistribute them according to your new sequence.",
                    });
                  } catch (error) {
                    console.error("Failed to update course terms:", error);
                    toast({
                      title: "Error",
                      description: "Failed to update some courses. Please refresh to see the current state.",
                      variant: "destructive"
                    });
                  }
                }
              }}
              className="gap-1"
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}