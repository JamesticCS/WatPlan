"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { XIcon, PlusIcon, AlertTriangleIcon } from "lucide-react";
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
  CUSTOM: [] // Custom sequence will be built dynamically
};

// Default custom sequence terms for initialization - matching the standard 4-year program
const defaultCustomSequence: AcademicTerm[] = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"];

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
  const [customTerms, setCustomTerms] = useState<AcademicTerm[]>(defaultCustomSequence);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [newTermName, setNewTermName] = useState("");
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
          ? `Work Term ${activeTerms.slice(0, parseInt(targetTermIndex)).filter(t => t === "COOP").length + 1}` 
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
    if (sequence === "CUSTOM") {
      return customTerms;
    }
    return coopSequencePatterns[sequence];
  }, [sequence, customTerms]);

  // Generate unique term IDs for each term in the sequence
  const termIds = useMemo(() => {
    return activeTerms.map((term, index) => ({
      term,
      id: `${term}-${index}`
    }));
  }, [activeTerms]);
  
  // Functions for custom sequence management
  const addCustomTerm = (termType: AcademicTerm = "1A") => {
    // Add the term with animation
    setCustomTerms(prev => [...prev, termType]);
    
    // After state update, scroll to the new term
    setTimeout(() => {
      const termColumns = document.querySelectorAll('.term-column');
      const newTermIndex = termColumns.length - 2; // Account for unscheduled section at end
      
      if (newTermIndex >= 0 && termColumns[newTermIndex]) {
        // Add animation class to the new term
        termColumns[newTermIndex].classList.add('term-new-added');
        
        // Scroll the term into view with behavior: 'smooth'
        termColumns[newTermIndex].scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center'
        });
        
        // Remove animation class after animation completes
        setTimeout(() => {
          termColumns[newTermIndex].classList.remove('term-new-added');
        }, 800);
      }
    }, 10);
  };
  
  const removeCustomTerm = (index: number) => {
    // First move any courses in this term to Unscheduled
    const termId = `${activeTerms[index]}-${index}`;
    const termCourses = coursesByTerm[termId] || [];
    
    if (termCourses.length > 0) {
      // Move courses to unscheduled
      const courseUpdates = termCourses.map(course => 
        updatePlanCourse(planId, course.id, { term: "Unscheduled", termIndex: null })
      );
      
      // Update local state
      setCourses(prevCourses => 
        prevCourses.map(course => 
          termCourses.some(c => c.id === course.id)
            ? { ...course, term: "Unscheduled", termIndex: null }
            : course
        )
      );
      
      // Execute the updates
      Promise.all(courseUpdates).catch(error => {
        console.error('Error moving courses to unscheduled:', error);
        toast({
          title: "Error",
          description: "Failed to move some courses. Please refresh the page.",
          variant: "destructive"
        });
      });
    }
    
    // Remove the term
    setCustomTerms(prev => prev.filter((_, i) => i !== index));
  };
  
  const moveCustomTerm = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    // Get references to the DOM elements
    const termElements = document.querySelectorAll('.term-column');
    if (termElements.length > fromIndex && termElements.length > toIndex) {
      // First, remove any existing animation classes to ensure clean state
      termElements[fromIndex].classList.remove('term-move-right', 'term-move-left', 'term-swap-right', 'term-swap-left');
      termElements[toIndex].classList.remove('term-move-right', 'term-move-left', 'term-swap-right', 'term-swap-left');
      
      // Add a visual indicator - add a temporary class to both terms for visual highlighting
      termElements[fromIndex].classList.add('term-highlight');
      termElements[toIndex].classList.add('term-highlight');
      
      // Make sure these terms are visible in the viewport before animating
      const termsContainer = document.querySelector('.terms-grid');
      if (termsContainer) {
        // Ensure both terms are visible before animation
        const containerRect = termsContainer.getBoundingClientRect();
        const fromTermRect = termElements[fromIndex].getBoundingClientRect();
        const toTermRect = termElements[toIndex].getBoundingClientRect();
        
        const needsScrolling = 
          (fromTermRect.left < containerRect.left || fromTermRect.right > containerRect.right) ||
          (toTermRect.left < containerRect.left || toTermRect.right > containerRect.right);
        
        if (needsScrolling) {
          // Use the middle element for best visibility
          const targetIndex = fromIndex < toIndex ? 
            fromIndex + Math.floor((toIndex - fromIndex) / 2) : 
            toIndex + Math.floor((fromIndex - toIndex) / 2);
          
          termElements[targetIndex].scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });
          
          // Give time for scrolling to complete before starting the animation
          setTimeout(() => applyTermMoveAnimation(), 300);
        } else {
          applyTermMoveAnimation();
        }
      } else {
        applyTermMoveAnimation();
      }
      
      function applyTermMoveAnimation() {
        // Are these adjacent terms? Then use swap animation
        const isAdjacent = Math.abs(fromIndex - toIndex) === 1;
        
        // Find all course items within each term to animate them together with the term
        const fromTermCourses = termElements[fromIndex].querySelectorAll('.course-item');
        const toTermCourses = termElements[toIndex].querySelectorAll('.course-item');
        
        // Define animation duration based on whether terms are adjacent
        const animationDuration = isAdjacent ? 550 : 450;
        
        // Apply term transition tracking class
        document.body.classList.add('term-transition-active');

        // Add animation classes based on direction
        if (isAdjacent) {
          // For adjacent terms, use the swap animation for a better visual
          if (fromIndex < toIndex) {
            // Moving right (swap with next)
            termElements[fromIndex].classList.add('term-swap-right');
            termElements[toIndex].classList.add('term-swap-left');
            
            // Add the same animation class to each course within the term
            fromTermCourses.forEach(course => course.classList.add('term-swap-right'));
            toTermCourses.forEach(course => course.classList.add('term-swap-left'));
          } else {
            // Moving left (swap with previous)
            termElements[fromIndex].classList.add('term-swap-left');
            termElements[toIndex].classList.add('term-swap-right');
            
            // Add the same animation class to each course within the term
            fromTermCourses.forEach(course => course.classList.add('term-swap-left'));
            toTermCourses.forEach(course => course.classList.add('term-swap-right'));
          }
        } else {
          // For non-adjacent terms, use the move animation
          if (fromIndex < toIndex) {
            // Moving right
            termElements[fromIndex].classList.add('term-move-right');
            termElements[toIndex].classList.add('term-move-left');
            
            // Add the same animation class to each course within the term
            fromTermCourses.forEach(course => course.classList.add('term-move-right'));
            toTermCourses.forEach(course => course.classList.add('term-move-left'));
          } else {
            // Moving left
            termElements[fromIndex].classList.add('term-move-left');
            termElements[toIndex].classList.add('term-move-right');
            
            // Add the same animation class to each course within the term
            fromTermCourses.forEach(course => course.classList.add('term-move-left'));
            toTermCourses.forEach(course => course.classList.add('term-move-right'));
          }
        }
        
        // Add a pulse effect to the term headers for more visual impact
        const fromTermHeader = termElements[fromIndex].querySelector('.term-header');
        const toTermHeader = termElements[toIndex].querySelector('.term-header');
        
        if (fromTermHeader) fromTermHeader.classList.add('term-header-pulse');
        if (toTermHeader) toTermHeader.classList.add('term-header-pulse');
        
        // Remove animation classes after animation completes
        setTimeout(() => {
          // Remove term animation classes
          termElements[fromIndex].classList.remove('term-move-right', 'term-move-left', 'term-swap-right', 'term-swap-left', 'term-highlight');
          termElements[toIndex].classList.remove('term-move-right', 'term-move-left', 'term-swap-right', 'term-swap-left', 'term-highlight');
          
          // Remove course animation classes
          fromTermCourses.forEach(course => 
            course.classList.remove('term-move-right', 'term-move-left', 'term-swap-right', 'term-swap-left'));
          toTermCourses.forEach(course => 
            course.classList.remove('term-move-right', 'term-move-left', 'term-swap-right', 'term-swap-left'));
          
          // Remove header pulse effect
          if (fromTermHeader) fromTermHeader.classList.remove('term-header-pulse');
          if (toTermHeader) toTermHeader.classList.remove('term-header-pulse');
          
          // Remove transition tracking class
          document.body.classList.remove('term-transition-active');
        }, animationDuration); 
        
        // Update the state
        setCustomTerms(prev => {
          const newTerms = [...prev];
          const [movedTerm] = newTerms.splice(fromIndex, 1);
          newTerms.splice(toIndex, 0, movedTerm);
          return newTerms;
        });
      }
    } else {
      // If DOM elements aren't ready yet, just update the state
      setCustomTerms(prev => {
        const newTerms = [...prev];
        const [movedTerm] = newTerms.splice(fromIndex, 1);
        newTerms.splice(toIndex, 0, movedTerm);
        return newTerms;
      });
    }
  };
  
  const updateCustomTermName = (index: number, newName: string) => {
    setCustomTerms(prev => {
      const newTerms = [...prev];
      newTerms[index] = newName;
      return newTerms;
    });
    setEditingTermId(null);
  };

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
        
        /* Fix for Safari - but exclude action buttons */
        .course-item > *:not(.remove-course-btn):not(button) {
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
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        
        /* Term move animations */
        @keyframes moveLeft {
          0% { transform: translateX(0); opacity: 1; box-shadow: 0 0 0 rgba(0,0,0,0); z-index: 1; }
          10% { transform: translateX(-5px); opacity: 0.95; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
          30% { transform: translateX(-20px); opacity: 0.9; background-color: var(--primary-light, rgba(0, 100, 255, 0.08)); }
          60% { transform: translateX(-30px); opacity: 0.85; box-shadow: 0 0 20px rgba(0,0,0,0.15); background-color: var(--primary-light, rgba(0, 100, 255, 0.12)); }
          80% { transform: translateX(-10px); opacity: 0.9; background-color: var(--primary-light, rgba(0, 100, 255, 0.06)); }
          100% { transform: translateX(0); opacity: 1; box-shadow: 0 0 0 rgba(0,0,0,0); z-index: 1; background-color: transparent; }
        }

        @keyframes moveRight {
          0% { transform: translateX(0); opacity: 1; box-shadow: 0 0 0 rgba(0,0,0,0); z-index: 1; }
          10% { transform: translateX(5px); opacity: 0.95; box-shadow: 0 0 10px rgba(0,0,0,0.05); }
          30% { transform: translateX(20px); opacity: 0.9; background-color: var(--primary-light, rgba(0, 100, 255, 0.08)); }
          60% { transform: translateX(30px); opacity: 0.85; box-shadow: 0 0 20px rgba(0,0,0,0.15); background-color: var(--primary-light, rgba(0, 100, 255, 0.12)); }
          80% { transform: translateX(10px); opacity: 0.9; background-color: var(--primary-light, rgba(0, 100, 255, 0.06)); }
          100% { transform: translateX(0); opacity: 1; box-shadow: 0 0 0 rgba(0,0,0,0); z-index: 1; background-color: transparent; }
        }
        
        @keyframes swapLeft {
          0% { transform: translateX(0); z-index: 2; box-shadow: 0 0 0 rgba(0,0,0,0); }
          20% { transform: translateX(-30%); z-index: 2; box-shadow: 0 5px 20px rgba(0,0,0,0.1); background-color: var(--primary-light, rgba(0, 100, 255, 0.08)); }
          40% { transform: translateX(calc(-100% - 1rem)); z-index: 2; box-shadow: 0 5px 25px rgba(0,0,0,0.15); background-color: var(--primary-light, rgba(0, 100, 255, 0.12)); }
          60% { transform: translateX(calc(-100% - 1rem)); z-index: 1; box-shadow: 0 5px 25px rgba(0,0,0,0.15); background-color: var(--primary-light, rgba(0, 100, 255, 0.12)); }
          80% { transform: translateX(-30%); z-index: 1; box-shadow: 0 3px 15px rgba(0,0,0,0.1); background-color: var(--primary-light, rgba(0, 100, 255, 0.08)); }
          100% { transform: translateX(0); z-index: 1; box-shadow: 0 0 0 rgba(0,0,0,0); background-color: transparent; }
        }
        
        @keyframes swapRight {
          0% { transform: translateX(0); z-index: 1; box-shadow: 0 0 0 rgba(0,0,0,0); }
          20% { transform: translateX(30%); z-index: 1; box-shadow: 0 5px 15px rgba(0,0,0,0.1); background-color: var(--primary-light, rgba(0, 100, 255, 0.08)); }
          40% { transform: translateX(calc(100% + 1rem)); z-index: 1; box-shadow: 0 5px 25px rgba(0,0,0,0.15); background-color: var(--primary-light, rgba(0, 100, 255, 0.12)); }
          60% { transform: translateX(calc(100% + 1rem)); z-index: 2; box-shadow: 0 5px 25px rgba(0,0,0,0.15); background-color: var(--primary-light, rgba(0, 100, 255, 0.12)); }
          80% { transform: translateX(30%); z-index: 2; box-shadow: 0 3px 15px rgba(0,0,0,0.1); background-color: var(--primary-light, rgba(0, 100, 255, 0.08)); }
          100% { transform: translateX(0); z-index: 2; box-shadow: 0 0 0 rgba(0,0,0,0); background-color: transparent; }
        }
        
        /* Button click animations for arrow buttons */
        @keyframes arrowClickLeft {
          0% { transform: translateX(0); }
          50% { transform: translateX(-2px); }
          100% { transform: translateX(0); }
        }
        
        @keyframes arrowClickRight {
          0% { transform: translateX(0); }
          50% { transform: translateX(2px); }
          100% { transform: translateX(0); }
        }
        
        .arrow-click-left {
          animation: arrowClickLeft 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        
        .arrow-click-right {
          animation: arrowClickRight 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .term-move-left {
          animation: moveLeft 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          position: relative;
        }

        .term-move-right {
          animation: moveRight 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          position: relative;
        }
        
        .term-swap-left {
          animation: swapLeft 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          position: relative;
        }
        
        .term-swap-right {
          animation: swapRight 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          position: relative;
        }
        
        /* New term animation */
        @keyframes termAddedAnimation {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
          50% {
            opacity: 1;
            transform: translateY(-5px) scale(1.02);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
          }
          75% {
            transform: translateY(2px) scale(1);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            box-shadow: 0 0 0 rgba(0,0,0,0);
          }
        }
        
        .term-new-added {
          animation: termAddedAnimation 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
          z-index: 10;
        }
        
        /* Term highlight effect during swap */
        .term-highlight {
          outline: 2px solid var(--primary, #0070f3);
          box-shadow: 0 0 15px rgba(0, 112, 243, 0.3);
          z-index: 3;
        }
        
        /* Term header pulse animation */
        @keyframes termHeaderPulse {
          0% { background-color: var(--primary); }
          50% { background-color: var(--primary-light, rgba(0, 112, 243, 0.8)); }
          100% { background-color: var(--primary); }
        }
        
        .term-header-pulse {
          animation: termHeaderPulse 0.5s ease-in-out;
        }
        
        /* Global class to prevent other interactions during transitions */
        .term-transition-active .term-column:not(.term-highlight) {
          opacity: 0.7;
          transition: opacity 0.3s ease;
        }
        
        /* Ensure course items inherit animation from term */
        .term-swap-left .course-item,
        .term-swap-right .course-item,
        .term-move-left .course-item,
        .term-move-right .course-item {
          animation: none !important; /* Override any existing animations */
          transition: none !important; /* Override any existing transitions */
          transform: none !important; /* Keep position relative to parent */
        }
        
        /* Animated connector between swapping terms */
        @keyframes swapConnector {
          0% { opacity: 0; width: 0; }
          40% { opacity: 1; width: 100%; }
          60% { opacity: 1; width: 100%; }
          100% { opacity: 0; width: 0; }
        }
        
        .term-transition-active::before {
          content: '';
          position: fixed;
          top: 50%;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--primary, #0070f3);
          z-index: 5;
          opacity: 0;
          transform: translateY(-50%);
          animation: swapConnector 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
          pointer-events: none;
        }
        
        /* Remove course button hover effect */
        .remove-course-btn {
          cursor: pointer !important;
          z-index: 10 !important;
          position: relative !important;
          pointer-events: auto !important;
        }
        
        .remove-course-btn:hover {
          background-color: rgba(239, 68, 68, 0.1) !important;
        }
        
        .remove-course-btn:hover svg {
          color: rgb(239, 68, 68) !important;
        }
        
        .remove-course-btn:active {
          background-color: rgba(239, 68, 68, 0.2) !important;
        }
        
        /* Override the parent pointer-events rule for remove buttons */
        .course-item .remove-course-btn * {
          pointer-events: auto !important;
        }
        
        /* Animation for course removal */
        @keyframes removeAnimation {
          0% {
            opacity: 1;
            transform: scale(1);
            max-height: 200px;
          }
          70% {
            opacity: 0;
            transform: scale(0.95);
            max-height: 200px;
          }
          100% {
            opacity: 0;
            transform: scale(0.9);
            max-height: 0;
            margin: 0;
            padding: 0;
            border-width: 0;
          }
        }
        
        .course-item-removing {
          animation: removeAnimation 0.4s ease-in-out forwards !important;
          overflow: hidden;
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
                  // If changing to custom sequence, initialize with default terms
                  if (newSequence === "CUSTOM") {
                    setCustomTerms(defaultCustomSequence);
                  }
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
      
      {/* Custom Sequence Controls */}
      {sequence === "CUSTOM" && (
        <div className="flex items-center gap-3 mb-4 p-4 border rounded-lg bg-muted/20 animate-fadeIn">
          <div className="flex-1">
            <h3 className="text-sm font-medium mb-1">Custom Sequence</h3>
            <p className="text-xs text-muted-foreground">
              Create your own custom academic sequence by adding, removing, and rearranging terms.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center">
              <select 
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  if (selectedValue) {
                    addCustomTerm(selectedValue as AcademicTerm);
                    e.currentTarget.value = ""; // Reset after selection
                  }
                }}
                value=""
              >
                <option value="" disabled>Add term...</option>
                <option value="1A">1A</option>
                <option value="1B">1B</option>
                <option value="2A">2A</option>
                <option value="2B">2B</option>
                <option value="3A">3A</option>
                <option value="3B">3B</option>
                <option value="4A">4A</option>
                <option value="4B">4B</option>
                <option value="COOP">Co-op Term</option>
                <option value="Custom">Custom Term</option>
              </select>
            </div>
            <Button
              variant="outline" 
              size="sm"
              className="whitespace-nowrap"
              onClick={() => addCustomTerm("Custom")}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Custom Term
            </Button>
          </div>
        </div>
      )}
      
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
              <div className={`term-header ${sequence === "CUSTOM" ? "flex flex-col" : "flex justify-between items-center"}`}>
                <div className={`flex ${sequence === "CUSTOM" ? "justify-between w-full" : "items-center gap-2"}`}>
                  <div className="flex flex-col">
                    {sequence === "CUSTOM" && editingTermId === id ? (
                      <input
                        type="text"
                        className="rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={newTermName}
                        onChange={(e) => setNewTermName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateCustomTermName(index, newTermName);
                          } else if (e.key === 'Escape') {
                            setEditingTermId(null);
                          }
                        }}
                        onBlur={() => {
                          if (newTermName.trim()) {
                            updateCustomTermName(index, newTermName);
                          } else {
                            setEditingTermId(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      <span 
                        className={sequence === "CUSTOM" ? "cursor-pointer hover:underline" : ""}
                        onClick={() => {
                          if (sequence === "CUSTOM") {
                            setEditingTermId(id);
                            setNewTermName(term === "COOP" 
                              ? `Work Term ${activeTerms.slice(0, index).filter(t => t === "COOP").length + 1}` 
                              : term);
                          }
                        }}
                      >
                        {term === "COOP" 
                          ? `Work Term ${activeTerms.slice(0, index).filter(t => t === "COOP").length + 1}` 
                          : term}
                      </span>
                    )}
                    {sequence !== "CUSTOM" && coursesByTerm[id]?.length > 0 && (
                      <span className="text-xs font-medium py-0.5 px-2 mt-1 rounded-md bg-emerald-500/20 text-emerald-700 animate-fadeIn ml-0 inline-block">
                        {coursesByTerm[id].reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0).toFixed(1)} units
                      </span>
                    )}
                  </div>
                  
                  {sequence === "CUSTOM" && (
                    <div className="flex items-center">
                      {index > 0 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 mx-1 hover:bg-primary-foreground/20"
                          onClick={(e) => {
                            // Apply animation to the button
                            const button = e.currentTarget;
                            button.classList.remove('arrow-click-left');
                            // Force a reflow to restart animation
                            void button.offsetWidth;
                            button.classList.add('arrow-click-left');
                            
                            // Move the term
                            moveCustomTerm(index, index - 1);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                          </svg>
                        </Button>
                      )}
                      {index < activeTerms.length - 1 && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 mx-1 hover:bg-primary-foreground/20"
                          onClick={(e) => {
                            // Apply animation to the button
                            const button = e.currentTarget;
                            button.classList.remove('arrow-click-right');
                            // Force a reflow to restart animation
                            void button.offsetWidth;
                            button.classList.add('arrow-click-right');
                            
                            // Move the term
                            moveCustomTerm(index, index + 1);
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 mx-1 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeCustomTerm(index)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                      <Link href={`/plans/${planId}/add-course?term=${id}`}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-primary-foreground/20">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                  
                  {sequence !== "CUSTOM" && (
                    <Link href={`/plans/${planId}/add-course?term=${id}`}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary-foreground/20">
                        <PlusIcon className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
                
                {sequence === "CUSTOM" && coursesByTerm[id]?.length > 0 && (
                  <div className="mt-1">
                    <span className="text-xs font-medium py-0.5 px-2 rounded-md bg-emerald-500/20 text-emerald-700 animate-fadeIn">
                      {coursesByTerm[id].reduce((sum, course) => sum + (parseFloat(course.units) || 0), 0).toFixed(1)} units
                    </span>
                  </div>
                )}
              </div>
              <div className="divide-y">
                {coursesByTerm[id]?.map((course, courseIndex) => (
                  <div 
                    key={`${course.id}-${id}-${courseIndex}`} 
                    className={`p-3 hover:bg-muted/50 transition-colors course-item ${course.justDropped ? 'course-item-dropped' : ''} ${course.isRemoving ? 'course-item-removing' : ''}`}
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
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 remove-course-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault(); // Prevent any unexpected behavior
                            
                            try {
                              // Store course info before removing for use in toast
                              const courseCode = course.courseCode;
                              const catalogNumber = course.catalogNumber;
                              const courseId = course.id;
                              
                              // Flag the course for animation first
                              setCourses(prevCourses => 
                                prevCourses.map(c => 
                                  c.id === courseId 
                                    ? { ...c, isRemoving: true } 
                                    : c
                                )
                              );
                              
                              // We rely on the class-based animation instead of inline style
                              
                              // Wait for animation to play before removing from state
                              setTimeout(async () => {
                                // Remove from local state
                                setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId));
                                
                                // Call API to completely remove the course from the plan
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
                              }, 300); // Slightly shorter than animation duration
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: error instanceof Error ? error.message : "Failed to remove course",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          <XIcon className="h-3 w-3 text-gray-500 hover:text-red-500 transition-colors" />
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
      
      {/* Always display course backlog */}
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
          <div className="flex items-center gap-2">
            <span>Course Backlog</span>
          </div>
          <Link href={`/plans/${planId}/add-course?term=Unscheduled`}>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary-foreground/20">
              <PlusIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="divide-y">
          {coursesByTerm['Unscheduled']?.length > 0 ? (
            coursesByTerm['Unscheduled'].map((course, index) => (
              <div 
                key={`${course.id}-Unscheduled-${index}`} 
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/50 transition-colors course-item ${course.justDropped ? 'course-item-dropped' : ''} ${course.isRemoving ? 'course-item-removing' : ''}`}
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
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="remove-course-btn"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault(); // Prevent any unexpected behavior
                      try {
                        // Store course info before removing for use in toast
                        const courseCode = course.courseCode;
                        const catalogNumber = course.catalogNumber;
                        const courseId = course.id;
                        
                        // Flag the course for animation first
                        setCourses(prevCourses => 
                          prevCourses.map(c => 
                            c.id === courseId 
                              ? { ...c, isRemoving: true } 
                              : c
                          )
                        );
                        
                        // We rely on the class-based animation instead of inline style
                        
                        // Wait for animation to play before removing from state
                        setTimeout(async () => {
                          // Remove from local state
                          setCourses(prevCourses => prevCourses.filter(c => c.id !== courseId));
                          
                          // Call API to completely remove the course from the plan
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
                        }, 300); // Slightly shorter than animation duration
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to remove course",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <XIcon className="h-4 w-4 text-gray-500 hover:text-red-500 transition-colors" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>Drag courses here to save for later</p>
              <Link href={`/plans/${planId}/add-course?term=Unscheduled`}>
                <Button variant="ghost" size="sm" className="mt-2">
                  Add a course
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

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
                  // If changing to custom sequence, initialize with default terms
                  if (pendingSequence === "CUSTOM") {
                    setCustomTerms(defaultCustomSequence);
                  }
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