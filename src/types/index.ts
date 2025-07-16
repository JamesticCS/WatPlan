// ─── Enums ──────────────────────────────────────────────────────────────────

export type LogicType = 'ALL' | 'N_OF' | 'COURSE' | 'UNITS' | 'TEXT_RULE';

export type CredentialCategory =
  | 'HONOURS' | 'JOINT_HONOURS' | 'GENERAL' | 'MINOR'
  | 'SPECIALIZATION' | 'OPTION' | 'DOUBLE_DEGREE'
  | 'DIPLOMA' | 'CERTIFICATE' | 'DEGREE_REQUIREMENTS';

export type CoopSequence =
  | 'NO_COOP' | 'SEQUENCE_1' | 'SEQUENCE_2'
  | 'SEQUENCE_3' | 'SEQUENCE_4' | 'CUSTOM';

export type CourseStatus =
  | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'
  | 'FAILED' | 'DROPPED' | 'BACKLOG';

export type RequirementStatus = 'NOT_STARTED' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

export type AcademicTerm = '1A' | '1B' | '2A' | '2B' | '3A' | '3B' | '4A' | '4B' | 'COOP' | string;

// ─── API ────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

// ─── Academic Structure ─────────────────────────────────────────────────────

export interface Faculty {
  id: string;
  name: string;
  programs?: Program[];
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  facultyId: string;
  faculty?: Faculty;
}

export interface Program {
  id: string;
  kualiId: string;
  name: string;
  faculties?: Faculty[];
  degrees?: Degree[];
}

export interface Degree {
  id: string;
  kualiId: string;
  programId: string;
  name: string;
  credentialType: string;
  credentialCategory: CredentialCategory;
  systemsOfStudy?: string | null;
  declarationRequirements?: string | null;
  minimumAverages?: string | null;
  graduationRequirements?: string | null;
  additionalConstraints?: string | null;
  studentAudience?: string | null;
  notes?: string | null;
  offeredBy?: string | null;
  academicCalendarYear: string;
  program?: Program;
  sections?: RequirementSection[];
}

// ─── Course ─────────────────────────────────────────────────────────────────

export interface Course {
  id: string;
  kualiId: string;
  code: string;
  number: string;
  subjectId: string;
  name: string;
  description?: string | null;
  units: number;
  antiRequisiteText?: string | null;
  specialCourseGrading?: string | null;
  specialConsentToAdd?: string | null;
  specialConsentToDrop?: string | null;
  crossListedWith?: string[];
  uwflowLiked?: number | null;
  uwflowEasy?: number | null;
  uwflowUseful?: number | null;
  uwflowRatingsCount?: number | null;
  prerequisiteRootId?: string | null;
  corequisiteRootId?: string | null;
  prerequisiteRoot?: Requirement | null;
  corequisiteRoot?: Requirement | null;
  subjectRef?: Subject;
}

// ─── Requirements (recursive tree) ─────────────────────────────────────────

export interface RequirementSection {
  id: string;
  degreeId: string;
  label: string;
  displayOrder: number;
  requirementRootId?: string | null;
  requirementRoot?: Requirement | null;
}

export interface Requirement {
  id: string;
  parentId?: string | null;
  logicType: LogicType;
  label?: string | null;
  n?: number | null;
  courseId?: string | null;
  courseCode?: string | null;
  minGradeRequired?: number | null;
  unitsRequired?: number | null;
  subjectRestriction?: string | null;
  levelRestriction?: string | null;
  minAverage?: number | null;
  maxFailures?: number | null;
  failureRestriction?: string | null;
  concentrationType?: string | null;
  text?: string | null;
  displayOrder: number;
  children?: Requirement[];
  course?: Course | null;
  // Populated from PlanRequirementCache when viewing plan progress
  status?: RequirementStatus;
  progress?: number;
  isManualOverride?: boolean;
}

// ─── Plan ───────────────────────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string;
  userId: string;
  academicCalendarYear?: string | null;
  coopSequence: CoopSequence;
  customTerms: unknown;
  createdAt: string;
  updatedAt: string;
  courses?: PlanCourse[];
  degrees?: PlanDegree[];
}

export interface PlanCourse {
  id: string;
  planId: string;
  courseId: string;
  term: string;
  status: CourseStatus;
  gradeLabel?: string | null;
  gradeNumeric?: number | null;
  displayOrder: number;
  course?: Course;
}

export interface PlanDegree {
  id: string;
  planId: string;
  degreeId: string;
  degree?: Degree;
  requirementCache?: PlanRequirementCache[];
  // UI state (not persisted)
  isRemoving?: boolean;
}

export interface PlanRequirementCache {
  id: string;
  planDegreeId: string;
  requirementId: string;
  status: RequirementStatus;
  progress: number;
  isManualOverride: boolean;
  requirement?: Requirement;
}

// ─── Warnings ───────────────────────────────────────────────────────────────

export type WarningType = 'PREREQUISITE' | 'COREQUISITE' | 'ANTIREQUISITE';

export interface Warning {
  type: WarningType;
  message: string;
  details: string;
  dismissed: boolean;
}

export interface CourseWarning {
  courseId: string;
  courseCode: string;
  warnings: Warning[];
}

// ─── UI helpers ─────────────────────────────────────────────────────────────

/** Flattened course + plan status for the course list component */
export interface CourseWithStatus {
  id: string;
  courseId: string;
  code: string;
  number: string;
  name: string;
  description?: string | null;
  units: number;
  term: string;
  status: CourseStatus;
  gradeLabel?: string | null;
  gradeNumeric?: number | null;
  displayOrder: number;
  justDropped?: boolean;
}

/** Helper to format credential category for display */
export function formatCredentialCategory(cat: CredentialCategory): string {
  const map: Record<CredentialCategory, string> = {
    HONOURS: 'Honours',
    JOINT_HONOURS: 'Joint Honours',
    GENERAL: 'General',
    MINOR: 'Minor',
    SPECIALIZATION: 'Specialization',
    OPTION: 'Option',
    DOUBLE_DEGREE: 'Double Degree',
    DIPLOMA: 'Diploma',
    CERTIFICATE: 'Certificate',
    DEGREE_REQUIREMENTS: 'Degree Requirements',
  };
  return map[cat] || cat;
}

/** Format a course code for display (e.g., "CS341" → "CS 341") */
export function formatCourseCode(code: string): string {
  const match = code.match(/^([A-Z]+)(\d.*)$/);
  if (match) return `${match[1]} ${match[2]}`;
  return code;
}
