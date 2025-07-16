import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CourseStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Determine requirement status based on progress (0-1 scale)
export function determineRequirementStatus(
  progress: number
): 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' {
  if (progress >= 1) return 'COMPLETED';
  if (progress > 0) return 'IN_PROGRESS';
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
export function isCourseFailed(status: CourseStatus, gradeLabel?: string | null): boolean {
  return status === 'FAILED' || (status === 'COMPLETED' && gradeLabel === 'F');
}

// Check if a course meets minimum grade requirement
export function courseExceedsMinimumGrade(
  planCourse: { status: CourseStatus; gradeLabel?: string | null; gradeNumeric?: number | null },
  minGrade: number
): boolean {
  if (planCourse.status !== 'COMPLETED') return false;

  if (planCourse.gradeNumeric != null) {
    return planCourse.gradeNumeric >= minGrade;
  }

  // If we don't have numeric grade, try to parse from letter grade
  if (planCourse.gradeLabel) {
    const gradeMap: Record<string, number> = {
      'A+': 95, 'A': 90, 'A-': 85,
      'B+': 82, 'B': 78, 'B-': 75,
      'C+': 72, 'C': 68, 'C-': 65,
      'D+': 62, 'D': 58, 'D-': 55,
      'F': 45,
    };

    const numericGrade = gradeMap[planCourse.gradeLabel];
    if (numericGrade !== undefined) {
      return numericGrade >= minGrade;
    }

    const parsedGrade = parseInt(planCourse.gradeLabel, 10);
    if (!isNaN(parsedGrade)) {
      return parsedGrade >= minGrade;
    }
  }

  return false;
}

// Calculate weighted average grade for a set of courses
export function calculateAverageGrade(
  planCourses: { status: CourseStatus; gradeNumeric?: number | null; gradeLabel?: string | null; course?: { units: number } }[]
): number {
  const completedCourses = planCourses.filter(
    (pc) => pc.status === 'COMPLETED' && (pc.gradeNumeric != null || pc.gradeLabel != null)
  );

  if (completedCourses.length === 0) return 0;

  let totalPoints = 0;
  let totalUnits = 0;

  for (const course of completedCourses) {
    let courseGrade = 0;

    if (course.gradeNumeric != null) {
      courseGrade = course.gradeNumeric;
    } else if (course.gradeLabel) {
      const gradeMap: Record<string, number> = {
        'A+': 95, 'A': 90, 'A-': 85,
        'B+': 82, 'B': 78, 'B-': 75,
        'C+': 72, 'C': 68, 'C-': 65,
        'D+': 62, 'D': 58, 'D-': 55,
        'F': 45,
      };
      courseGrade = gradeMap[course.gradeLabel] || parseInt(course.gradeLabel, 10) || 0;
    }

    const units = course.course?.units || 1;
    totalPoints += courseGrade * units;
    totalUnits += units;
  }

  return totalUnits > 0 ? totalPoints / totalUnits : 0;
}

// Count failed courses with optional subject restriction
export function countFailedCourses(
  planCourses: { status: CourseStatus; gradeLabel?: string | null; course: { code: string } }[],
  subjectRestriction?: string | null
): number {
  return planCourses.filter((pc) => {
    const isFailed = pc.status === 'FAILED' || (pc.status === 'COMPLETED' && pc.gradeLabel === 'F');
    const matchesSubject =
      !subjectRestriction ||
      subjectRestriction.split(',').map((s) => s.trim()).some((s) => pc.course.code.startsWith(s));
    return isFailed && matchesSubject;
  }).length;
}
