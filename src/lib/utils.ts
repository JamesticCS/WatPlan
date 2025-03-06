import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CourseStatus, RequirementStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate percentage of a requirement completed based on courses completed
export function calculateRequirementProgressPercentage(
  requirementType: string,
  unitsRequired?: number,
  coursesRequired?: number,
  completedUnits = 0,
  completedCourses = 0
): number {
  if (requirementType === 'UNITS' && unitsRequired) {
    return Math.min(100, Math.round((completedUnits / unitsRequired) * 100));
  }
  
  if (requirementType === 'COURSE' || requirementType === 'COURSE_LIST') {
    if (coursesRequired) {
      return Math.min(100, Math.round((completedCourses / coursesRequired) * 100));
    }
  }
  
  return 0;
}

// Determine requirement status based on progress
export function determineRequirementStatus(
  progress: number
): RequirementStatus {
  if (progress >= 100) {
    return 'COMPLETED';
  } else if (progress > 0) {
    return 'IN_PROGRESS';
  }
  return 'NOT_STARTED';
}

// Check if a course is completed
export function isCourseCompleted(status: CourseStatus): boolean {
  return status === 'COMPLETED';
}

// Check if a course is in progress
export function isCourseInProgress(status: CourseStatus): boolean {
  return status === 'IN_PROGRESS';
}