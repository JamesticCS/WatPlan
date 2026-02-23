"use client";

import "@/components/plan/plan-course-list.css";
import { Button } from "@/components/ui/button";
import { XIcon, PlusIcon, ListChecks } from "lucide-react";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CourseWithStatus, AcademicTerm, CoopSequence as CoopSequenceType, Warning, formatCourseCode } from "@/types";
import { updatePlanCourse, removeCourseFromPlan, getPlanWarnings } from "@/lib/api";
import { CourseWarningIndicator } from "@/components/plan/course-warning-indicator";
import { useToast } from "@/hooks/use-toast";
import { PlanTranscriptUpload } from "@/components/plan/plan-transcript-upload";
import { CourseDetailDialog } from "@/components/plan/course-detail-dialog";
import { CourseStatusDialog } from "@/components/plan/course-status-dialog";
import { SequenceChangeDialog } from "@/components/plan/sequence-change-dialog";
import { getStatusBadge, GradeBadge } from "@/components/plan/grade-badge";

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
  // Course edit dialog state
  const [editingCourse, setEditingCourse] = useState<CourseWithStatus | null>(null);
  const [editStatus, setEditStatus] = useState<string>("PLANNED");
  const [editGradeNumeric, setEditGradeNumeric] = useState<string>("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  // Bulk status dialog state
  const [bulkStatusTermId, setBulkStatusTermId] = useState<string | null>(null);
  const [isSavingBulk, setIsSavingBulk] = useState(false);
  // Warnings state
  const [courseWarnings, setCourseWarnings] = useState<Map<string, Warning[]>>(new Map());
  // Course detail dialog state
  const [detailCourseCode, setDetailCourseCode] = useState<string | null>(null);
  // Ref to distinguish click from drag
  const dragStartedRef = useRef(false);
  const { toast } = useToast();
  
  // Function to handle drag start
  const handleDragStart = (e: React.DragEvent, course: CourseWithStatus) => {
    dragStartedRef.current = true;
    // Store the courseId (Course table ID) for API calls on drop
    e.dataTransfer.setData("courseId", course.courseId);
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
      elem.style.width = `${(e.currentTarget as HTMLElement).offsetWidth}px`;
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
      titleEl.textContent = formatCourseCode(course.code);

      const descEl = document.createElement('div');
      descEl.style.fontSize = "0.875rem";
      descEl.style.opacity = "0.7";
      descEl.textContent = course.name;
      
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
    
    const droppedCourseId = e.dataTransfer.getData("courseId");
    if (!droppedCourseId) {
      console.error('No course ID in drop data');
      return;
    }

    // Store the draggedCourse reference locally instead of depending on state
    // This prevents potential "Cannot update during an existing state transition" errors
    const localDraggedCourse = courses.find(c => c.courseId === droppedCourseId);
    if (!localDraggedCourse) {
      console.error('Course not found:', droppedCourseId);
      return;
    }
    const courseId = localDraggedCourse.courseId;
    
    // Extract the base term name and index from targetTermId (format: "term-index")
    const [targetTerm, targetTermIndex] = targetTermId.split('-');

    // Get current unique term id for the dragged course
    const currentTermId = localDraggedCourse.displayOrder !== undefined
      ? `${localDraggedCourse.term}-${localDraggedCourse.displayOrder}`
      : localDraggedCourse.term;
    
    // If dropping in same term and we have position info, this is a reorder
    if (currentTermId === targetTermId && targetPosition !== undefined) {
      // Reorder courses within the same term
      const termCourses = [...coursesByTerm[targetTermId]];
      const currentIndex = termCourses.findIndex(c => c.courseId === courseId);

      // Remove from current position
      if (currentIndex !== -1) {
        const [removed] = termCourses.splice(currentIndex, 1);

        // Insert at new position, accounting for the removed item
        const newPosition = targetPosition > currentIndex ? targetPosition - 1 : targetPosition;
        termCourses.splice(newPosition, 0, removed);

        // Update all courses (reorder only)
        const newCourses = courses.filter(course =>
          course.courseId !== courseId ||
          (course.term !== localDraggedCourse.term && course.displayOrder !== localDraggedCourse.displayOrder)
        );
        newCourses.push(...termCourses);
        setCourses(newCourses);
        return;
      }
    }

    // If we're just dropping in the same term with no position change, do nothing
    if (currentTermId === targetTermId && targetPosition === undefined) return;

    // Check if there is already a course with the same code in the target term
    const duplicateCourses = courses.filter(course =>
      course.courseId !== courseId && // Not the course we're moving
      course.code === localDraggedCourse.code &&
      course.term === targetTerm &&
      course.displayOrder === parseInt(targetTermIndex)
    );

    if (duplicateCourses.length > 0) {
      toast({
        title: "Cannot move course",
        description: `${formatCourseCode(localDraggedCourse.code)} is already in this term`,
        variant: "destructive",
      });
      return;
    }

    // Update the local state immediately for a responsive feel
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course.courseId === courseId
          ? {
              ...course,
              term: targetTerm,
              displayOrder: parseInt(targetTermIndex),
              justDropped: true
            }
          : course
      )
    );

    // Remove the justDropped flag after animation completes
    setTimeout(() => {
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.courseId === courseId
            ? { ...course, justDropped: false }
            : course
        )
      );
    }, 600);

    try {
      // Call the API to update the course term, including the display order for uniqueness
      const response = await updatePlanCourse(planId, courseId, {
        term: targetTerm,
        displayOrder: parseInt(targetTermIndex)
      });

      if (response.error) {
        // If there's an error, revert the local state
        setCourses(prevCourses =>
          prevCourses.map(course =>
            course.courseId === courseId
              ? {
                  ...course,
                  term: localDraggedCourse.term,
                  displayOrder: localDraggedCourse.displayOrder
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
          description: `Moved ${formatCourseCode(localDraggedCourse.code)} to ${termDisplay}`,
        });
      }
    } catch (error) {
      console.error('Error updating course term:', error);
      // Revert the local state on error
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course.courseId === courseId
            ? {
                ...course,
                term: localDraggedCourse.term,
                displayOrder: localDraggedCourse.displayOrder
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
  
  // Fetch warnings (debounced)
  const fetchWarnings = useCallback(async () => {
    const response = await getPlanWarnings(planId, activeTerms);
    if (response.data?.warnings) {
      const map = new Map<string, Warning[]>();
      for (const cw of response.data.warnings) {
        map.set(cw.courseId, cw.warnings);
      }
      setCourseWarnings(map);
    }
  }, [planId, activeTerms]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarnings();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchWarnings, courses]);

  const handleDismissWarning = useCallback(async (courseId: string, warningType: string) => {
    // Optimistic update
    setCourseWarnings(prev => {
      const next = new Map(prev);
      const warnings = next.get(courseId);
      if (warnings) {
        next.set(courseId, warnings.map(w =>
          w.type === warningType ? { ...w, dismissed: true } : w
        ));
      }
      return next;
    });
    // Persist: get current dismissed list and add the new type
    const currentWarnings = courseWarnings.get(courseId) || [];
    const currentDismissed: string[] = currentWarnings.filter(w => w.dismissed).map(w => w.type as string);
    if (!currentDismissed.includes(warningType)) {
      currentDismissed.push(warningType);
    }
    await updatePlanCourse(planId, courseId, { dismissedWarnings: currentDismissed });
  }, [planId, courseWarnings]);

  const handleRestoreWarning = useCallback(async (courseId: string, warningType: string) => {
    // Optimistic update
    setCourseWarnings(prev => {
      const next = new Map(prev);
      const warnings = next.get(courseId);
      if (warnings) {
        next.set(courseId, warnings.map(w =>
          w.type === warningType ? { ...w, dismissed: false } : w
        ));
      }
      return next;
    });
    // Persist: remove from dismissed list
    const currentWarnings = courseWarnings.get(courseId) || [];
    const newDismissed = currentWarnings
      .filter(w => w.dismissed && w.type !== warningType)
      .map(w => w.type);
    await updatePlanCourse(planId, courseId, { dismissedWarnings: newDismissed });
  }, [planId, courseWarnings]);

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
        updatePlanCourse(planId, course.courseId, { term: "Unscheduled", displayOrder: 0 })
      );

      // Update local state
      setCourses(prevCourses =>
        prevCourses.map(course =>
          termCourses.some(c => c.id === course.id)
            ? { ...course, term: "Unscheduled", displayOrder: 0 }
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
        // Create unique term identifier based on term and displayOrder
        const uniqueTermId = course.displayOrder !== undefined
          ? `${course.term}-${course.displayOrder}`
          : null;
          
        // First check if we have an exact match for the term with its index
        if (uniqueTermId && Object.keys(grouped).includes(uniqueTermId)) {
          grouped[uniqueTermId].push(course);
        } else {
          // If no exact match, find a matching term in the active terms
          const termMatch = termIds.find(({ term }) => term === course.term);
          if (termMatch) {
            grouped[termMatch.id].push(course);
            
            // Update the course's displayOrder to match the found term
            // This prevents duplications by ensuring consistent displayOrder
            if (course.displayOrder === undefined || course.displayOrder !== parseInt(termMatch.id.split('-')[1])) {
              const termParts = termMatch.id.split('-');
              const displayOrder = parseInt(termParts[1]);

              // Update local state with correct displayOrder
              setCourses(prevCourses =>
                prevCourses.map(c =>
                  c.id === course.id
                    ? { ...c, displayOrder: displayOrder }
                    : c
                )
              );

              // Update in backend to ensure consistency
              updatePlanCourse(planId, course.courseId, {
                term: course.term,
                displayOrder: displayOrder
              }).catch(error => {
                console.error('Error updating course display order:', error);
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
    const duplicatesFound: { course: CourseWithStatus; termId: string; originalCourse: CourseWithStatus }[] = [];
    
    Object.keys(grouped).forEach(termId => {
      if (termId === 'Unscheduled') return; // Allow duplicates in unscheduled
      
      // Track unique course identifiers 
      const courseCodes = new Map();
      
      // Find any duplicates without modifying the groups yet
      grouped[termId].forEach(course => {
        const courseIdentifier = course.code;
        
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
        updatePlanCourse(planId, course.courseId, {
          term: "Unscheduled",
          displayOrder: 0
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
  

  const openEditDialog = (course: CourseWithStatus) => {
    setEditingCourse(course);
    setEditStatus(course.status);
    setEditGradeNumeric(course.gradeNumeric != null ? String(course.gradeNumeric) : "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCourse) return;
    setIsSavingEdit(true);

    let gradeLabel: string | undefined = undefined;
    let gradeNumeric: number | undefined = undefined;

    if (editStatus === "COMPLETED" && editGradeNumeric.trim()) {
      const num = parseFloat(editGradeNumeric);
      if (!isNaN(num) && num >= 0 && num <= 100) {
        gradeNumeric = num;
        gradeLabel = String(num);
      }
    }

    try {
      const response = await updatePlanCourse(planId, editingCourse.courseId, {
        status: editStatus,
        gradeLabel: gradeLabel ?? null as any,
        gradeNumeric: gradeNumeric ?? null as any,
      });

      if (response.error) {
        toast({ title: "Error", description: response.error, variant: "destructive" });
        return;
      }

      // Update local state
      setCourses(prev =>
        prev.map(c =>
          c.courseId === editingCourse.courseId
            ? { ...c, status: editStatus as any, gradeLabel: gradeLabel ?? null, gradeNumeric: gradeNumeric ?? null }
            : c
        )
      );

      setEditDialogOpen(false);
      setEditingCourse(null);
      toast({ title: "Course updated", description: `Updated ${formatCourseCode(editingCourse.code)}` });
    } catch {
      toast({ title: "Error", description: "Failed to update course", variant: "destructive" });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleBulkStatus = async (termId: string, newStatus: string) => {
    const termCourses = coursesByTerm[termId];
    if (!termCourses || termCourses.length === 0) return;
    setIsSavingBulk(true);

    // Update local state immediately
    setCourses(prev =>
      prev.map(c =>
        termCourses.some(tc => tc.courseId === c.courseId)
          ? { ...c, status: newStatus as any }
          : c
      )
    );

    // Update all courses in parallel
    try {
      await Promise.all(
        termCourses.map(c =>
          updatePlanCourse(planId, c.courseId, { status: newStatus })
        )
      );
      toast({
        title: "Term updated",
        description: `Marked ${termCourses.length} course${termCourses.length > 1 ? 's' : ''} as ${newStatus === 'COMPLETED' ? 'Completed' : newStatus === 'IN_PROGRESS' ? 'In Progress' : 'Planned'}`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to update some courses", variant: "destructive" });
    } finally {
      setIsSavingBulk(false);
      setBulkStatusTermId(null);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border rounded-lg p-4 bg-muted/30 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center">
              <PlanTranscriptUpload 
                planId={planId}
                onCoursesAdded={async () => {
                  // Refresh the course list after transcript is processed
                  // Fetch the updated list of courses from the API
                  try {
                    const response = await fetch(`/api/plans/${planId}/courses`);
                    const data = await response.json();
                    
                    if (data.planCourses) {
                      // Map API data to CourseWithStatus format
                      const updatedCourses = data.planCourses.map((pc: any) => ({
                        id: pc.id,
                        courseId: pc.courseId,
                        code: pc.course.code,
                        number: pc.course.number,
                        name: pc.course.name,
                        units: pc.course.units,
                        term: pc.term || "Unscheduled",
                        displayOrder: pc.displayOrder,
                        status: pc.status,
                        gradeLabel: pc.gradeLabel
                      }));
                      
                      // Update state with the refreshed courses
                      setCourses(updatedCourses);
                    }
                  } catch (error) {
                    console.error("Error refreshing courses after transcript upload:", error);
                    // Still make a state update to trigger rerender
                    setCourses([...courses]);
                  }
                }}
              />
              <span className="ml-2 text-sm text-muted-foreground">
                Upload your transcript to automatically add completed courses
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
                        {coursesByTerm[id].reduce((sum, course) => sum + (course.units || 0), 0).toFixed(1)} units
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
                      {coursesByTerm[id]?.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 hover:bg-primary-foreground/20"
                          onClick={() => setBulkStatusTermId(bulkStatusTermId === id ? null : id)}
                          title="Set status for all courses in this term"
                        >
                          <ListChecks className="h-4 w-4" />
                        </Button>
                      )}
                      <Link href={`/plans/${planId}/add-course?term=${id}`}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 hover:bg-primary-foreground/20">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}

                  {sequence !== "CUSTOM" && (
                    <div className="flex items-center gap-0.5">
                      {coursesByTerm[id]?.length > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-primary-foreground/20"
                          onClick={() => setBulkStatusTermId(bulkStatusTermId === id ? null : id)}
                          title="Set status for all courses in this term"
                        >
                          <ListChecks className="h-4 w-4" />
                        </Button>
                      )}
                      <Link href={`/plans/${planId}/add-course?term=${id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary-foreground/20">
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
                
                {sequence === "CUSTOM" && coursesByTerm[id]?.length > 0 && (
                  <div className="mt-1">
                    <span className="text-xs font-medium py-0.5 px-2 rounded-md bg-emerald-500/20 text-emerald-700 animate-fadeIn">
                      {coursesByTerm[id].reduce((sum, course) => sum + (course.units || 0), 0).toFixed(1)} units
                    </span>
                  </div>
                )}
              </div>
              {bulkStatusTermId === id && (
                <div className="px-3 py-2 bg-muted/50 border-b flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground">Set all to:</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={isSavingBulk}
                    onClick={() => handleBulkStatus(id, 'PLANNED')}>Planned</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={isSavingBulk}
                    onClick={() => handleBulkStatus(id, 'IN_PROGRESS')}>In Progress</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" disabled={isSavingBulk}
                    onClick={() => handleBulkStatus(id, 'COMPLETED')}>Completed</Button>
                </div>
              )}
              <div className="divide-y">
                {coursesByTerm[id]?.map((course, courseIndex) => (
                  <div
                    key={`${course.id}-${id}-${courseIndex}`}
                    className={`p-3 hover:bg-muted/50 transition-colors cursor-pointer course-item ${course.justDropped ? 'course-item-dropped' : ''} ${(course as any).isRemoving ? 'course-item-removing' : ''}`}
                    draggable
                    onClick={(e) => {
                      if (dragStartedRef.current) {
                        dragStartedRef.current = false;
                        return;
                      }
                      // Don't open edit dialog if clicking interactive buttons
                      const target = e.target as HTMLElement;
                      if (target.closest('.course-item-btn')) return;
                      openEditDialog(course);
                    }}
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
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <button
                          className="font-medium hover:underline hover:text-primary transition-colors course-item-btn"
                          onClick={(e) => { e.stopPropagation(); setDetailCourseCode(course.code); }}
                          draggable={false}
                        >
                          {formatCourseCode(course.code)}
                        </button>
                        {getStatusBadge(course.status)}
                      </div>
                      {courseWarnings.get(course.courseId)?.some(w => !w.dismissed) ? (
                        <div className="course-item-btn" draggable={false}>
                          <CourseWarningIndicator
                            warnings={courseWarnings.get(course.courseId)!}
                            onDismiss={(type) => handleDismissWarning(course.courseId, type)}
                            onRestore={(type) => handleRestoreWarning(course.courseId, type)}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">{course.name}</div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm flex items-center gap-2">
                        <span>{Number(course.units).toFixed(1)} units</span>
                        <GradeBadge course={course} />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 course-item-btn remove-course-btn"
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault(); // Prevent any unexpected behavior
                            
                            try {
                              // Store course info before removing for use in toast
                              const courseDisplay = formatCourseCode(course.code);
                              const cId = course.courseId;

                              // Flag the course for animation first
                              setCourses(prevCourses =>
                                prevCourses.map(c =>
                                  c.courseId === cId
                                    ? { ...c, isRemoving: true }
                                    : c
                                )
                              );

                              // We rely on the class-based animation instead of inline style

                              // Wait for animation to play before removing from state
                              setTimeout(async () => {
                                // Remove from local state
                                setCourses(prevCourses => prevCourses.filter(c => c.courseId !== cId));

                                // Call API to completely remove the course from the plan
                                const response = await removeCourseFromPlan(planId, cId);
                                if (response.error) {
                                  // If API fails, add the course back
                                  setCourses(prevCourses => [...prevCourses, course]);
                                  throw new Error(response.error);
                                }
                                
                                toast({
                                  title: "Course removed",
                                  description: `Removed ${courseDisplay} from your plan`,
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
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer course-item ${course.justDropped ? 'course-item-dropped' : ''} ${(course as any).isRemoving ? 'course-item-removing' : ''}`}
                draggable
                onClick={() => {
                  if (dragStartedRef.current) {
                    dragStartedRef.current = false;
                    return;
                  }
                  openEditDialog(course);
                }}
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
                    <button
                      className="font-medium hover:underline hover:text-primary transition-colors course-item-btn"
                      onClick={(e) => { e.stopPropagation(); setDetailCourseCode(course.code); }}
                      draggable={false}
                    >
                      {formatCourseCode(course.code)}
                    </button>
                    {getStatusBadge(course.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">{course.name}</div>
                  {(course.gradeLabel || course.gradeNumeric != null) && (
                    <div className="text-sm mt-1">
                      <GradeBadge course={course} />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="course-item-btn remove-course-btn"
                    onClick={async (e) => {
                      e.stopPropagation();
                      e.preventDefault(); // Prevent any unexpected behavior
                      try {
                        // Store course info before removing for use in toast
                        const courseDisplay = formatCourseCode(course.code);
                        const cId = course.courseId;

                        // Flag the course for animation first
                        setCourses(prevCourses =>
                          prevCourses.map(c =>
                            c.courseId === cId
                              ? { ...c, isRemoving: true }
                              : c
                          )
                        );

                        // We rely on the class-based animation instead of inline style

                        // Wait for animation to play before removing from state
                        setTimeout(async () => {
                          // Remove from local state
                          setCourses(prevCourses => prevCourses.filter(c => c.courseId !== cId));

                          // Call API to completely remove the course from the plan
                          const response = await removeCourseFromPlan(planId, cId);
                          if (response.error) {
                            // If API fails, add the course back
                            setCourses(prevCourses => [...prevCourses, course]);
                            throw new Error(response.error);
                          }

                          toast({
                            title: "Course removed",
                            description: `Removed ${courseDisplay} from your plan`,
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

      <SequenceChangeDialog
        open={dialogOpen}
        pendingSequence={pendingSequence}
        onConfirm={async () => {
          if (pendingSequence) {
            const scheduledCourses = courses.filter(c => c.term && c.term !== "Unscheduled");
            setCourses(prev =>
              prev.map(course => ({
                ...course,
                term: course.term && course.term !== "Unscheduled" ? "Unscheduled" : course.term
              }))
            );
            if (pendingSequence === "CUSTOM") {
              setCustomTerms(defaultCustomSequence);
            }
            setSequence(pendingSequence);
            setDialogOpen(false);
            setPendingSequence(null);

            const updatePromises = scheduledCourses.map(course =>
              updatePlanCourse(planId, course.courseId, { term: "Unscheduled" })
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
        onCancel={() => {
          setDialogOpen(false);
          setPendingSequence(null);
        }}
      />

      <CourseStatusDialog
        open={editDialogOpen}
        course={editingCourse}
        status={editStatus}
        gradeNumeric={editGradeNumeric}
        isSaving={isSavingEdit}
        onStatusChange={setEditStatus}
        onGradeChange={setEditGradeNumeric}
        onSave={handleSaveEdit}
        onClose={() => {
          setEditDialogOpen(false);
          setEditingCourse(null);
        }}
      />

      <CourseDetailDialog
        courseCode={detailCourseCode}
        onClose={() => setDetailCourseCode(null)}
      />
    </div>
  );
}