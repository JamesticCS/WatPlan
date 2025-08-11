import { PrismaClient, LogicType } from '@prisma/client';
import { CourseData, DegreeData, RequirementNode } from './types';

const CALENDAR_YEAR = '2025-2026';
const UNKNOWN_FACULTY = 'Unknown';

export class ScraperDb {
  private prisma: PrismaClient;
  private unknownFacultyId: string | null = null;
  // Cache course lookups to avoid repeated DB queries
  private courseIdByKualiId = new Map<string, string>();
  private courseIdByCode = new Map<string, string>();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ─── Faculty ────────────────────────────────────────────────────────────

  async upsertFaculty(name: string): Promise<string> {
    const faculty = await this.prisma.faculty.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    return faculty.id;
  }

  async getUnknownFacultyId(): Promise<string> {
    if (this.unknownFacultyId) return this.unknownFacultyId;
    this.unknownFacultyId = await this.upsertFaculty(UNKNOWN_FACULTY);
    return this.unknownFacultyId;
  }

  // ─── Subject ────────────────────────────────────────────────────────────

  async upsertSubject(code: string, name: string, facultyId?: string): Promise<string> {
    const fId = facultyId || await this.getUnknownFacultyId();
    const subject = await this.prisma.subject.upsert({
      where: { code },
      create: { code, name, facultyId: fId },
      update: { name, ...(facultyId ? { facultyId } : {}) },
    });
    return subject.id;
  }

  // ─── Course ─────────────────────────────────────────────────────────────

  async upsertCourse(data: CourseData, subjectGroupName: string): Promise<string> {
    // Upsert Subject — strip redundant "(CODE)" suffix from group name
    const cleanName = subjectGroupName.replace(/\s*\([A-Z]+\)\s*$/, '').trim();
    const subjectId = await this.upsertSubject(data.subjectCode, cleanName);

    // Upsert Course (without prereq/coreq links first)
    const course = await this.prisma.course.upsert({
      where: { code: data.code },
      create: {
        kualiId: data.kualiId,
        code: data.code,
        number: data.number,
        subjectId,
        name: data.name,
        description: data.description,
        units: data.units,
        antiRequisiteText: data.antiRequisiteText,
        specialCourseGrading: data.specialCourseGrading,
        specialConsentToAdd: data.specialConsentToAdd,
        specialConsentToDrop: data.specialConsentToDrop,
        crossListedWith: data.crossListedWith,
      },
      update: {
        code: data.code,
        number: data.number,
        subjectId,
        name: data.name,
        description: data.description,
        units: data.units,
        antiRequisiteText: data.antiRequisiteText,
        specialCourseGrading: data.specialCourseGrading,
        specialConsentToAdd: data.specialConsentToAdd,
        specialConsentToDrop: data.specialConsentToDrop,
        crossListedWith: data.crossListedWith,
      },
    });

    // Cache the course ID
    this.courseIdByKualiId.set(data.kualiId, course.id);
    this.courseIdByCode.set(data.code, course.id);

    // Handle prerequisite tree
    if (data.prerequisiteTree) {
      if (course.prerequisiteRootId) {
        await this.deleteRequirementTree(course.prerequisiteRootId);
      }
      const rootId = await this.createRequirementTree(data.prerequisiteTree, null);
      await this.prisma.course.update({
        where: { id: course.id },
        data: { prerequisiteRootId: rootId },
      });
    }

    // Handle corequisite tree
    if (data.corequisiteTree) {
      if (course.corequisiteRootId) {
        await this.deleteRequirementTree(course.corequisiteRootId);
      }
      const rootId = await this.createRequirementTree(data.corequisiteTree, null);
      await this.prisma.course.update({
        where: { id: course.id },
        data: { corequisiteRootId: rootId },
      });
    }

    return course.id;
  }

  // ─── Requirement Tree ───────────────────────────────────────────────────

  async createRequirementTree(node: RequirementNode, parentId: string | null): Promise<string> {
    // Resolve courseId for COURSE leaf nodes
    let courseId: string | null = null;
    if (node.logicType === 'COURSE') {
      if (node.courseKualiId) {
        courseId = this.courseIdByKualiId.get(node.courseKualiId) || null;
        if (!courseId) {
          const course = await this.prisma.course.findUnique({
            where: { kualiId: node.courseKualiId },
            select: { id: true },
          });
          if (course) {
            courseId = course.id;
            this.courseIdByKualiId.set(node.courseKualiId, course.id);
          }
        }
      }
      if (!courseId && node.courseCode) {
        courseId = this.courseIdByCode.get(node.courseCode) || null;
        if (!courseId) {
          const course = await this.prisma.course.findUnique({
            where: { code: node.courseCode },
            select: { id: true },
          });
          if (course) {
            courseId = course.id;
            this.courseIdByCode.set(node.courseCode, course.id);
          }
        }
      }
    }

    const req = await this.prisma.requirement.create({
      data: {
        parentId,
        logicType: node.logicType as LogicType,
        label: node.label,
        n: node.n,
        courseId,
        courseCode: node.courseCode,
        minGradeRequired: node.minGradeRequired,
        unitsRequired: node.unitsRequired,
        subjectRestriction: node.subjectRestriction,
        levelRestriction: node.levelRestriction,
        text: node.text,
        displayOrder: node.displayOrder,
      },
    });

    // Recursively create children
    for (const child of node.children) {
      await this.createRequirementTree(child, req.id);
    }

    return req.id;
  }

  async deleteRequirementTree(rootId: string): Promise<void> {
    // Collect all node IDs in the tree
    const allIds = await this.collectTreeIds(rootId);
    if (allIds.length === 0) return;

    // Null out FK references pointing to these requirements
    await this.prisma.course.updateMany({
      where: { prerequisiteRootId: { in: allIds } },
      data: { prerequisiteRootId: null },
    });
    await this.prisma.course.updateMany({
      where: { corequisiteRootId: { in: allIds } },
      data: { corequisiteRootId: null },
    });
    await this.prisma.requirementSection.updateMany({
      where: { requirementRootId: { in: allIds } },
      data: { requirementRootId: null },
    });

    // Delete PlanRequirementCache entries
    await this.prisma.planRequirementCache.deleteMany({
      where: { requirementId: { in: allIds } },
    });

    // Null out parent references then delete all nodes
    await this.prisma.requirement.updateMany({
      where: { id: { in: allIds } },
      data: { parentId: null },
    });
    await this.prisma.requirement.deleteMany({
      where: { id: { in: allIds } },
    });
  }

  private async collectTreeIds(rootId: string): Promise<string[]> {
    const ids: string[] = [rootId];
    const children = await this.prisma.requirement.findMany({
      where: { parentId: rootId },
      select: { id: true },
    });
    for (const child of children) {
      const childIds = await this.collectTreeIds(child.id);
      ids.push(...childIds);
    }
    return ids;
  }

  // ─── Program ────────────────────────────────────────────────────────────

  async upsertProgram(kualiId: string, name: string, facultyId: string): Promise<string> {
    const program = await this.prisma.program.upsert({
      where: { kualiId },
      create: {
        kualiId,
        name,
        faculties: { connect: { id: facultyId } },
      },
      update: {
        name,
        // Use connect (additive) not set (replace), because a program's degrees
        // may come from different faculties (e.g. Mathematical Physics has both
        // BMath from Math and BSc from Science)
        faculties: { connect: { id: facultyId } },
      },
    });
    return program.id;
  }

  // ─── Degree ─────────────────────────────────────────────────────────────

  async upsertDegree(data: DegreeData): Promise<string> {
    // Determine faculty
    const facultyName = data.offeredBy || UNKNOWN_FACULTY;
    const facultyId = await this.upsertFaculty(facultyName);

    // Upsert Program
    const programId = await this.upsertProgram(
      data.programGroupKualiId,
      data.programGroupName,
      facultyId,
    );

    // Check if degree already exists
    const existing = await this.prisma.degree.findUnique({
      where: {
        kualiId_academicCalendarYear: {
          kualiId: data.kualiId,
          academicCalendarYear: CALENDAR_YEAR,
        },
      },
      include: { sections: true },
    });

    // Delete old sections and their requirement trees
    if (existing) {
      for (const section of existing.sections) {
        if (section.requirementRootId) {
          await this.deleteRequirementTree(section.requirementRootId);
        }
      }
      await this.prisma.requirementSection.deleteMany({
        where: { degreeId: existing.id },
      });
    }

    // Upsert Degree
    const degree = await this.prisma.degree.upsert({
      where: {
        kualiId_academicCalendarYear: {
          kualiId: data.kualiId,
          academicCalendarYear: CALENDAR_YEAR,
        },
      },
      create: {
        kualiId: data.kualiId,
        programId,
        name: data.name,
        credentialType: data.credentialType,
        credentialCategory: data.credentialCategory,
        systemsOfStudy: data.systemsOfStudy,
        declarationRequirements: data.declarationRequirements,
        minimumAverages: data.minimumAverages,
        graduationRequirements: data.graduationRequirements,
        additionalConstraints: data.additionalConstraints,
        studentAudience: data.studentAudience,
        notes: data.notes,
        offeredBy: data.offeredBy,
        academicCalendarYear: CALENDAR_YEAR,
      },
      update: {
        programId,
        name: data.name,
        credentialType: data.credentialType,
        credentialCategory: data.credentialCategory,
        systemsOfStudy: data.systemsOfStudy,
        declarationRequirements: data.declarationRequirements,
        minimumAverages: data.minimumAverages,
        graduationRequirements: data.graduationRequirements,
        additionalConstraints: data.additionalConstraints,
        studentAudience: data.studentAudience,
        notes: data.notes,
        offeredBy: data.offeredBy,
      },
    });

    // Create new RequirementSections with trees
    for (const section of data.sections) {
      let requirementRootId: string | null = null;
      if (section.requirementTree) {
        requirementRootId = await this.createRequirementTree(section.requirementTree, null);
      }
      await this.prisma.requirementSection.create({
        data: {
          degreeId: degree.id,
          label: section.label,
          displayOrder: section.displayOrder,
          requirementRootId,
        },
      });
    }

    return degree.id;
  }

  // ─── Post-Phase Resolution ──────────────────────────────────────────────

  /** Get course codes referenced in requirement trees but not in the courses table */
  async getUnlinkedCourseCodes(): Promise<string[]> {
    const unlinked = await this.prisma.requirement.findMany({
      where: {
        logicType: 'COURSE',
        courseId: null,
        courseCode: { not: null },
      },
      select: { courseCode: true },
    });
    const codes = new Set<string>();
    for (const r of unlinked) {
      if (r.courseCode) codes.add(r.courseCode);
    }
    // Filter out codes that DO exist in the courses table (just not linked yet)
    const existing = await this.prisma.course.findMany({
      where: { code: { in: Array.from(codes) } },
      select: { code: true },
    });
    const existingSet = new Set(existing.map(c => c.code));
    return Array.from(codes).filter(c => !existingSet.has(c));
  }

  /** Resolve COURSE requirement nodes that have courseCode but no courseId */
  async resolveUnlinkedCourseRequirements(): Promise<number> {
    const unlinked = await this.prisma.requirement.findMany({
      where: {
        logicType: 'COURSE',
        courseId: null,
        courseCode: { not: null },
      },
    });

    let resolved = 0;
    for (const req of unlinked) {
      if (!req.courseCode) continue;
      const course = await this.prisma.course.findUnique({
        where: { code: req.courseCode },
        select: { id: true },
      });
      if (course) {
        await this.prisma.requirement.update({
          where: { id: req.id },
          data: { courseId: course.id },
        });
        resolved++;
      }
    }
    return resolved;
  }

  /** Resolve Subject → Faculty mapping using Degree offeredBy data.
   *  Strategy: for each subject, find degrees whose requirement sections
   *  reference courses from that subject, then assign the most common faculty. */
  async resolveSubjectFaculties(): Promise<number> {
    // Build a map: subjectId → facultyId counts
    const subjects = await this.prisma.subject.findMany({
      select: { id: true, code: true },
    });

    let resolved = 0;
    for (const subject of subjects) {
      // Find all courses for this subject
      const courses = await this.prisma.course.findMany({
        where: { subjectId: subject.id },
        select: { id: true },
      });
      if (courses.length === 0) continue;
      const courseIds = courses.map(c => c.id);

      // Find all requirement nodes referencing these courses
      const reqs = await this.prisma.requirement.findMany({
        where: { courseId: { in: courseIds } },
        select: { id: true },
      });
      if (reqs.length === 0) continue;
      const reqIds = reqs.map(r => r.id);

      // Walk up from these requirements to find their root nodes
      // (a requirement's root is the one with parentId = null in its ancestor chain)
      const rootIds = new Set<string>();
      for (const reqId of reqIds) {
        let currentId = reqId;
        for (let depth = 0; depth < 20; depth++) {
          const node = await this.prisma.requirement.findUnique({
            where: { id: currentId },
            select: { id: true, parentId: true },
          });
          if (!node || !node.parentId) {
            rootIds.add(currentId);
            break;
          }
          currentId = node.parentId;
        }
      }

      // Find RequirementSections with these root IDs → get their Degrees → get Faculty
      const sections = await this.prisma.requirementSection.findMany({
        where: { requirementRootId: { in: Array.from(rootIds) } },
        include: {
          degree: {
            include: {
              program: { include: { faculties: true } },
            },
          },
        },
      });

      // Count faculties (excluding "Unknown")
      const facultyCounts = new Map<string, { id: string; name: string; count: number }>();
      for (const section of sections) {
        for (const faculty of section.degree.program.faculties) {
          if (faculty.name === UNKNOWN_FACULTY) continue;
          const entry = facultyCounts.get(faculty.id) || { id: faculty.id, name: faculty.name, count: 0 };
          entry.count++;
          facultyCounts.set(faculty.id, entry);
        }
      }

      // Assign the most common faculty
      let bestFaculty: { id: string; name: string; count: number } | null = null;
      for (const entry of facultyCounts.values()) {
        if (!bestFaculty || entry.count > bestFaculty.count) {
          bestFaculty = entry;
        }
      }

      if (bestFaculty) {
        await this.prisma.subject.update({
          where: { id: subject.id },
          data: { facultyId: bestFaculty.id },
        });
        resolved++;
      }
    }
    return resolved;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
