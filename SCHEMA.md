# WatPlan Final Schema

Complete schema specification for the WatPlan database redesign. All tables, all columns, no ambiguity. Ready for Prisma implementation.

---

## `Faculty`

Top of the academic hierarchy. Represents a UW faculty (e.g. Faculty of Mathematics, Faculty of Engineering).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| name | String | unique | e.g. "Faculty of Mathematics" |
| createdAt | DateTime | default now() | |
| updatedAt | DateTime | auto-updated | |

**Relations**: `subjects Subject[]`, `programs Program[]`

---

## `Subject`

Represents a course subject/department code. Every course belongs to a subject, every subject belongs to a faculty.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| code | String | unique | e.g. "CS", "AMATH", "PHYS" |
| name | String | | e.g. "Computer Science", "Applied Mathematics" |
| facultyId | String | FK → Faculty.id | |
| createdAt | DateTime | default now() | |
| updatedAt | DateTime | auto-updated | |

**Relations**: `faculty Faculty`, `courses Course[]`

---

## `Course`

A single UW undergraduate course. Prereqs and coreqs are stored as recursive trees in the `Requirement` table, linked via root node FKs. Antirequisites are a flat list of codes stored directly.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| kualiId | String | unique | Stable Kuali hash ID, e.g. "Skb6pOVmKh". Used to match rows on re-scrape without relying on code alone |
| code | String | unique | e.g. "CS341". Full course code including subject |
| subject | String | | e.g. "CS". Denormalized from code for query convenience |
| number | String | | e.g. "341". Denormalized from code for query convenience |
| subjectId | String | FK → Subject.id | Relational link to Subject for integrity and faculty→subject→course browsing |
| name | String | | e.g. "Algorithms" |
| description | String? | nullable | Full calendar description text |
| units | Float | | 0.25 or 0.50 |
| antirequisites | String[] | default [] | Flat list of course codes, e.g. ["CS231", "ECE406"]. Stored as codes not FKs because some antireq courses may not exist in our DB (e.g. grad courses, Laurier courses) |
| prerequisiteRootId | String? | nullable, FK → Requirement.id | Root node of the prerequisite requirement tree. Null if no prereqs |
| corequisiteRootId | String? | nullable, FK → Requirement.id | Root node of the corequisite requirement tree. Null if no coreqs |
| createdAt | DateTime | default now() | |
| updatedAt | DateTime | auto-updated | |

**Relations**: `subjectRef Subject`, `prerequisiteRoot Requirement?`, `corequisiteRoot Requirement?`, `planCourses PlanCourse[]`, `requirementRefs Requirement[]` (inverse of Requirement.courseId)

---

## `Requirement`

A single node in a recursive requirement tree. Used for both course prerequisites/corequisites AND degree course requirements. Self-referential via `parentId` to support arbitrary nesting depth.

**How it works**: A `Course` or `Degree` row points to a root node via FK. The evaluator walks the tree recursively from the root.

**Example** — CS341 requires "(CS240 or CS240E) AND (CS245 or CS245E or SE212)":
- One root `ALL` node (parentId = null)
- One `N_OF` child (n=1) with children CS240, CS240E
- One `N_OF` child (n=1) with children CS245, CS245E, SE212

**Context matters**: The same table stores two different kinds of trees. The evaluator must know which mode it's in:
- **Prereq trees** (referenced by `Course.prerequisiteRootId`): check whether a student CAN take a course
- **Degree requirement trees** (referenced by `Degree.requirementRootId`): compute completion progress with percentages

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| parentId | String? | nullable, FK → Requirement.id | Null = root node. Non-null = child of another requirement node |
| logicType | Enum | required | `ALL` — all children must be satisfied. `N_OF` — at least n children must be satisfied. `COURSE` — a specific course (leaf node). `UNITS` — a unit count rule (e.g. "3.0 units of AMATH or PHYS at 300+ level"). `TEXT_RULE` — free-text rule the app can't auto-evaluate (shown as manual checklist) |
| label | String? | nullable | Human-readable section heading for group nodes. e.g. "Core Mathematics Courses", "Elective Requirements". Set on `ALL`/`N_OF` nodes where the calendar has a named section. Null on `COURSE` leaf nodes |
| n | Int? | nullable | Only set when logicType = `N_OF`. The number of children that must be satisfied, e.g. 1, 2 |
| courseId | String? | nullable, FK → Course.id | Only set when logicType = `COURSE`. FK to the required course |
| courseCode | String? | nullable | Only set when logicType = `COURSE`. Denormalized course code (e.g. "CS240") stored alongside courseId. Acts as fallback if the course doesn't exist in DB yet, and makes queries easier |
| minGradeRequired | Int? | nullable | Modifier for `COURSE` nodes. Minimum grade percentage required for this course, e.g. 60. Evaluator checks `gradeNumeric >= minGradeRequired` |
| unitsRequired | Float? | nullable | Only set when logicType = `UNITS`. The number of units required, e.g. 3.0 |
| subjectRestriction | String? | nullable | Only set when logicType = `UNITS`. Restricts which courses count, e.g. "AMATH,PHYS" (comma-separated) |
| levelRestriction | String? | nullable | Only set when logicType = `UNITS`. Restricts course level, e.g. "300-400" meaning 300 or 400-level only |
| minAverage | Float? | nullable | Modifier for `UNITS` nodes. Minimum weighted average required across matching courses, e.g. 65.0. Evaluator computes unit-weighted average of `gradeNumeric` values |
| maxFailures | Int? | nullable | Modifier for `UNITS` nodes. Maximum number of failed courses allowed, e.g. 2. Evaluator counts courses with status=FAILED |
| failureRestriction | String? | nullable | Modifier for `UNITS` nodes. Subject code restriction for failure counting, e.g. "CS". Only counts failures in this subject. Used alongside `maxFailures` |
| concentrationType | String? | nullable | Modifier for `N_OF` nodes. When set to `"SINGLE_SUBJECT"`, all N selected children must be from the same subject code. e.g. "Pick 4 courses from {STAT, CS, CO, AMATH} but all 4 must be from ONE of those subjects" |
| text | String? | nullable | Only set when logicType = `TEXT_RULE`. The raw text of the rule as it appears on the calendar, e.g. "Complete an additional 3.0 units of any AMATH or PHYS courses, with a minimum of 1.5 units at the 300- or 400-level" |
| displayOrder | Int | default 0 | Position among siblings — preserves the calendar's ordering when rendering the tree |
| createdAt | DateTime | default now() | No updatedAt — requirements are deleted and fully recreated on re-import, never updated in place |

**Relations**: `parent Requirement?`, `children Requirement[]`, `course Course?`

---

## `Program`

A program group on the calendar (e.g. "Computer Science"). Multiple distinct degrees live under one program.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| kualiId | String | unique | Kuali group identifier |
| name | String | unique | e.g. "Computer Science", "Applied Mathematics" |
| facultyId | String | FK → Faculty.id | |
| createdAt | DateTime | default now() | |
| updatedAt | DateTime | auto-updated | |

**Relations**: `faculty Faculty`, `degrees Degree[]`

---

## `Degree`

One specific plan/credential from the calendar. Every calendar plan is its own row — CS BCS Honours, CS BMath Honours, and CS Minor are three separate `Degree` records even though they're all under the "Computer Science" program group. Minors and specializations have their own rows and their own requirement trees.

Versioned by academic calendar year. A re-scrape for 2025-2026 creates new rows instead of overwriting 2024-2025 ones. Existing plans continue pointing to their original Degree rows.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| kualiId | String | | Kuali plan identifier, e.g. "SJPJkCAih". Not unique alone — unique combined with academicCalendarYear |
| programId | String | FK → Program.id | Which program group this degree belongs to |
| name | String | | Full calendar title, e.g. "Computer Science (Bachelor of Computer Science - Honours)" |
| credentialType | String | | The credential portion of the name, e.g. "Bachelor of Computer Science - Honours" |
| credentialCategory | Enum | required | Inferred from the plan name. Values: `HONOURS`, `JOINT_HONOURS`, `GENERAL`, `MINOR`, `SPECIALIZATION`, `OPTION`, `DOUBLE_DEGREE` |
| systemsOfStudy | String[] | default [] | e.g. ["Co-operative", "Regular"] |
| declarationRequirements | String? | nullable | Raw text of the declaration requirements section |
| minimumAverages | String[] | default [] | Bullet-point list from "Minimum Average(s) Required" section |
| graduationRequirements | String[] | default [] | Bullet-point list from "Graduation Requirements" section |
| additionalConstraints | String[] | default [] | Bullet-point list from "Additional Constraints" section |
| offeredBy | String? | nullable | e.g. "Faculty of Mathematics" |
| requirementRootId | String? | nullable, FK → Requirement.id | Root node of the degree's course requirement tree (the "Course Requirements" section). Null if none |
| academicCalendarYear | String | required | e.g. "2024-2025" — which calendar year this data was scraped from |
| createdAt | DateTime | default now() | |
| updatedAt | DateTime | auto-updated | |

**Unique constraint**: `@@unique([kualiId, academicCalendarYear])`

**Relations**: `program Program`, `requirementRoot Requirement?`, `planDegrees PlanDegree[]`

---

## `Plan`

A user's personal degree plan. One user can have multiple plans (e.g. "My CS plan", "What if I switched to Math"). Contains their term layout, co-op sequence, and all their planned courses.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| userId | String | FK → User.id, onDelete: Cascade | |
| name | String | | User-defined name, e.g. "My CS Co-op Plan" |
| academicCalendarYear | String? | nullable | e.g. "2024-2025". Records which calendar year the plan was created under. Not used for version-locking yet, but preserves the information |
| coopSequence | Enum | required | `NO_COOP`, `SEQUENCE_1`, `SEQUENCE_2`, `SEQUENCE_3`, `SEQUENCE_4`, `CUSTOM` |
| customTerms | Json | default [] | Array of custom term definitions when coopSequence = CUSTOM |
| createdAt | DateTime | default now() | |
| updatedAt | DateTime | auto-updated | |

**Unique constraint**: `@@unique([name, userId])`

**Relations**: `user User`, `courses PlanCourse[]`, `degrees PlanDegree[]`

---

## `PlanDegree`

Join table between a Plan and the Degree(s) it's pursuing. Most plans have one degree (their major), but some have multiple (major + minor, or a double degree).

No `type` field — since each calendar plan (CS Minor, CS Honours, etc.) is its own `Degree` row with its own `credentialCategory`, there's no need to redeclare the type here. The UI reads `Degree.credentialCategory` to know if something is a minor vs major.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| planId | String | FK → Plan.id, onDelete: Cascade | |
| degreeId | String | FK → Degree.id | |
| createdAt | DateTime | default now() | |

**Unique constraint**: `@@unique([planId, degreeId])`

**Relations**: `plan Plan`, `degree Degree`, `requirementCache PlanRequirementCache[]`

---

## `PlanCourse`

A course the user has placed in their plan, in a specific term. This is the core planning data.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| planId | String | FK → Plan.id, onDelete: Cascade | |
| courseId | String | FK → Course.id | |
| term | String | | e.g. "1A", "1B", "2A", "COOP_1", "UNSCHEDULED" |
| status | Enum | required | `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `FAILED`, `DROPPED`, `BACKLOG` |
| gradeLabel | String? | nullable | Letter or numeric grade as displayed: "A+", "CR", "INC", "87". Preserved exactly as it appears on the transcript. Used for display in the UI |
| gradeNumeric | Float? | nullable | Numeric equivalent for calculations: 95.0, null, 87.0. Derived from gradeLabel via conversion (A+=95, A=90, etc.). Used for GPA/average calculations and requirement evaluation (minGradeRequired, minAverage) |
| displayOrder | Int | default 0 | Position within the term in the drag-and-drop UI |
| createdAt | DateTime | default now() | |
| updatedAt | DateTime | auto-updated | |

**Unique constraint**: `@@unique([planId, courseId])`

**Relations**: `plan Plan`, `course Course`

---

## `PlanRequirementCache`

Materialized cache of computed requirement progress for a plan's degree. Avoids walking the recursive Requirement tree on every page load.

Computed on demand: when the user clicks "Refresh", when a course is added/moved/completed. Read from cache on page load.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| planDegreeId | String | FK → PlanDegree.id, onDelete: Cascade | |
| requirementId | String | FK → Requirement.id | |
| status | Enum | required | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED` |
| progress | Float | | 0.0–1.0, e.g. 0.67 means 67% complete |
| updatedAt | DateTime | auto-updated | |

**Unique constraint**: `@@unique([planDegreeId, requirementId])`

**Relations**: `planDegree PlanDegree`, `requirement Requirement`

---

## `User`

Standard NextAuth.js user model with guest account support. Unchanged from current schema except for relation updates.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| name | String? | nullable | |
| email | String? | unique | Case-insensitive uniqueness enforced via PostgreSQL trigger |
| emailVerified | DateTime? | nullable | |
| image | String? | nullable | |
| password | String? | nullable | Bcrypt-hashed. Used for credentials auth |
| isGuest | Boolean | default false | |
| guestExpiresAt | DateTime? | nullable | 30 days from creation for guest accounts |
| createdAt | DateTime | default now() | |
| updatedAt | DateTime | auto-updated | |

**Relations**: `accounts Account[]`, `sessions Session[]`, `plans Plan[]`

---

## `Account`

NextAuth.js OAuth provider accounts. Unchanged.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| userId | String | FK → User.id, onDelete: Cascade | |
| type | String | | |
| provider | String | | |
| providerAccountId | String | | |
| refresh_token | String? | nullable | |
| access_token | String? | nullable | |
| expires_at | Int? | nullable | |
| token_type | String? | nullable | |
| scope | String? | nullable | |
| id_token | String? | nullable | |
| session_state | String? | nullable | |

**Unique constraint**: `@@unique([provider, providerAccountId])`

**Relations**: `user User`

---

## `Session`

NextAuth.js session model. Unchanged.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | String | PK, cuid() | |
| sessionToken | String | unique | |
| userId | String | FK → User.id, onDelete: Cascade | |
| expires | DateTime | | |

**Relations**: `user User`

---

## `VerificationToken`

NextAuth.js email verification tokens. Unchanged.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| identifier | String | | |
| token | String | unique | |
| expires | DateTime | | |

**Unique constraint**: `@@unique([identifier, token])`

---

## Enum Definitions

```prisma
enum LogicType {
  ALL
  N_OF
  COURSE
  UNITS
  TEXT_RULE
}

enum CredentialCategory {
  HONOURS
  JOINT_HONOURS
  GENERAL
  MINOR
  SPECIALIZATION
  OPTION
  DOUBLE_DEGREE
}

enum CoopSequence {
  NO_COOP
  SEQUENCE_1
  SEQUENCE_2
  SEQUENCE_3
  SEQUENCE_4
  CUSTOM
}

enum CourseStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  FAILED
  DROPPED
  BACKLOG
}

enum RequirementStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}
```

---

## Tables Removed (vs. old schema)

| Old Table | Replacement |
|-----------|-------------|
| `DegreeRequirementSet` | `Requirement` tree (group nodes with `label`) |
| `DegreeRequirement` | `Requirement` tree (all node types) |
| `DegreeRequirementCourse` | `Requirement` nodes with `logicType: COURSE` and `courseId` FK |
| `RequirementList` | `Requirement` tree (`N_OF` nodes with children) |
| `RequirementListCourse` | `Requirement` `COURSE` leaf nodes under an `N_OF` parent |
| `CourseSubstitution` | `N_OF` nodes in the tree (both options as siblings) |
| `PlanRequirement` | Replaced by `PlanRequirementCache` (simplified) |

---

## New Tables (vs. old schema)

| New Table | Purpose |
|-----------|---------|
| `Subject` | Course subject/department codes linked to Faculty |
| `Requirement` | Unified recursive requirement tree |
| `PlanRequirementCache` | Materialized progress cache (simplified from old PlanRequirement) |
