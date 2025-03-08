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

// Check if a course failed
export function isCourseFailed(status: CourseStatus, grade?: string): boolean {
  return status === 'COMPLETED' && grade === 'F';
}

// Check if a course meets minimum grade requirement
export function courseExceedsMinimumGrade(planCourse: { status: CourseStatus, grade?: string, numericGrade?: number }, minGrade: number): boolean {
  if (planCourse.status !== 'COMPLETED') return false;
  
  if (planCourse.numericGrade !== undefined) {
    return planCourse.numericGrade >= minGrade;
  }
  
  // If we don't have numeric grade, try to parse from letter grade
  if (planCourse.grade) {
    const gradeMap: Record<string, number> = {
      'A+': 95, 'A': 90, 'A-': 85,
      'B+': 82, 'B': 78, 'B-': 75,
      'C+': 72, 'C': 68, 'C-': 65,
      'D+': 62, 'D': 58, 'D-': 55,
      'F': 45
    };
    
    const numericGrade = gradeMap[planCourse.grade];
    if (numericGrade !== undefined) {
      return numericGrade >= minGrade;
    }
    
    // Try to parse numeric grade from string
    const parsedGrade = parseInt(planCourse.grade, 10);
    if (!isNaN(parsedGrade)) {
      return parsedGrade >= minGrade;
    }
  }
  
  // If we can't determine the grade, default to failed
  return false;
}

// Calculate average grade for a set of courses
export function calculateAverageGrade(planCourses: { status: CourseStatus, numericGrade?: number, grade?: string, course?: { units: number } }[]): number {
  const completedCourses = planCourses.filter(pc => pc.status === 'COMPLETED' && 
    (pc.numericGrade !== undefined || pc.grade !== undefined));
  
  if (completedCourses.length === 0) return 0;
  
  let totalPoints = 0;
  let totalUnits = 0;
  
  for (const course of completedCourses) {
    let courseGrade = 0;
    
    if (course.numericGrade !== undefined) {
      courseGrade = course.numericGrade;
    } else if (course.grade) {
      // Use the same grade mapping as above
      const gradeMap: Record<string, number> = {
        'A+': 95, 'A': 90, 'A-': 85,
        'B+': 82, 'B': 78, 'B-': 75,
        'C+': 72, 'C': 68, 'C-': 65,
        'D+': 62, 'D': 58, 'D-': 55,
        'F': 45
      };
      
      courseGrade = gradeMap[course.grade] || parseInt(course.grade, 10) || 0;
    }
    
    const units = course.course?.units || 1;
    totalPoints += courseGrade * units;
    totalUnits += units;
  }
  
  return totalUnits > 0 ? totalPoints / totalUnits : 0;
}

// Count failed courses with optional subject restriction
export function countFailedCourses(
  planCourses: { status: CourseStatus, grade?: string, course: { courseCode: string } }[],
  subjectRestriction?: string
): number {
  return planCourses.filter(pc => {
    // First check if it's a failed course
    const isFailed = pc.status === 'COMPLETED' && pc.grade === 'F';
    
    // If no subject restriction or matches the restriction
    const matchesSubject = !subjectRestriction || 
      subjectRestriction.split(',').map(s => s.trim()).includes(pc.course.courseCode);
    
    return isFailed && matchesSubject;
  }).length;
}