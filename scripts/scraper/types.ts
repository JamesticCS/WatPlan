import { CredentialCategory } from '@prisma/client';

// ─── Requirement Tree (intermediate, before DB) ─────────────────────────────

export interface RequirementNode {
  logicType: 'ALL' | 'N_OF' | 'COURSE' | 'UNITS' | 'TEXT_RULE';
  label?: string;
  n?: number;
  courseCode?: string;
  courseKualiId?: string;
  minGradeRequired?: number;
  unitsRequired?: number;
  subjectRestriction?: string;
  levelRestriction?: string;
  text?: string;
  children: RequirementNode[];
  displayOrder: number;
}

// ─── Course (intermediate) ──────────────────────────────────────────────────

export interface CourseData {
  kualiId: string;
  code: string;
  subjectCode: string;
  number: string;
  name: string;
  description: string | null;
  units: number;
  antiRequisiteText: string | null;
  specialCourseGrading: string | null;
  specialConsentToAdd: string | null;
  specialConsentToDrop: string | null;
  crossListedWith: string[];
  prerequisiteTree: RequirementNode | null;
  corequisiteTree: RequirementNode | null;
}

// ─── Degree (intermediate) ──────────────────────────────────────────────────

export interface SectionData {
  label: string;
  displayOrder: number;
  requirementTree: RequirementNode | null;
}

export interface DegreeData {
  kualiId: string;
  programGroupName: string;
  programGroupKualiId: string;
  name: string;
  credentialType: string;
  credentialCategory: CredentialCategory;
  systemsOfStudy: string | null;
  declarationRequirements: string | null;
  minimumAverages: string | null;
  graduationRequirements: string | null;
  additionalConstraints: string | null;
  studentAudience: string | null;
  notes: string | null;
  offeredBy: string | null;
  sections: SectionData[];
}

// ─── Navigation ─────────────────────────────────────────────────────────────

export interface GroupLink {
  name: string;
  href: string;
}

export interface ItemLink {
  name: string;
  href: string;
  kualiId: string;
}
