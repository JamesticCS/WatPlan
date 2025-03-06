// Course status types
export type CourseStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

// Requirement status types
export type RequirementStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

// Degree types (Major, Minor, etc.)
export enum DegreeType {
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  SPECIALIZATION = 'SPECIALIZATION',
  OPTION = 'OPTION',
  JOINT = 'JOINT'
}

// Co-op sequence types
export type CoopSequence = 'NO_COOP' | 'SEQUENCE_1' | 'SEQUENCE_2' | 'SEQUENCE_3' | 'SEQUENCE_4' | 'CUSTOM';

// Term types for academic terms
export type AcademicTerm = '1A' | '1B' | '2A' | '2B' | '3A' | '3B' | '4A' | '4B' | 'COOP' | string;

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

// Faculty types
export interface Faculty {
  id: string;
  name: string;
  description?: string;
  programs: Program[];
}

// Program types
export interface Program {
  id: string;
  name: string;
  description?: string;
  facultyId: string;
  faculty?: Faculty;
  degrees: Degree[];
}

// Degree types
export interface Degree {
  id: string;
  name: string;
  description?: string;
  programId: string;
  program?: Program;
  requirementSets?: DegreeRequirementSet[];
}

// Course types
export interface Course {
  id: string;
  courseCode: string;
  catalogNumber: string;
  title: string;
  description?: string;
  units: number;
  prerequisites?: string;
  corequisites?: string;
  antirequisites?: string;
}

// Requirement types
export interface Requirement {
  id: string;
  name: string;
  description?: string;
  type: string;
  unitsRequired?: number;
  coursesRequired?: number;
  levelRestriction?: string;
  courseCodeRestriction?: string;
  status: RequirementStatus;
  progress?: number;
  courses?: Course[];
}

// Requirement set types
export interface DegreeRequirementSet {
  id: string;
  name: string;
  description?: string;
  degreeId: string;
  requirements: Requirement[];
}

// Academic Calendar Years
export type AcademicCalendarYear = '2024-2025' | '2023-2024' | '2022-2023' | '2021-2022' | '2020-2021';

// Plan types
export interface Plan {
  id: string;
  name: string;
  userId: string;
  created: string;
  updated: string;
  courses: PlanCourse[];
  degrees: PlanDegree[];
  academicCalendarYear?: AcademicCalendarYear;
}

// Plan course types
export interface PlanCourse {
  id: string;
  planId: string;
  courseId: string;
  course: Course;
  term?: string;
  termIndex?: number;
  status: CourseStatus;
  grade?: string;
}

// Mock course with term and status for client components
export interface CourseWithStatus extends Course {
  term?: string;
  termIndex?: number;
  status: CourseStatus;
  grade?: string;
  justDropped?: boolean;
}

// Plan degree types
export interface PlanDegree {
  id: string;
  planId: string;
  degreeId: string;
  degree: Degree;
  type: DegreeType;
  requirements: Requirement[];
  isRemoving?: boolean;
}