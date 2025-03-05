# WatPlan API Documentation

This document outlines the API endpoints implemented for the WatPlan application.

## Authentication

Authentication is handled by NextAuth.js with GitHub and Google OAuth providers. The session includes the user ID for authenticated requests.

## Courses API

### GET /api/courses

Fetches courses with optional filtering and pagination.

**Query Parameters:**
- `courseCode` (optional): Filter courses by code (e.g., "MATH", "CS")
- `limit` (optional): Maximum number of courses to return (default: 50)
- `offset` (optional): Number of courses to skip for pagination (default: 0)

**Response Example:**
```json
{
  "courses": [
    {
      "id": "course-uuid",
      "courseCode": "MATH",
      "catalogNumber": "135",
      "title": "Algebra for Honours Mathematics",
      "description": "...",
      "units": 0.5,
      "prerequisites": "...",
      "corequisites": null,
      "antirequisites": null
    }
  ],
  "pagination": {
    "total": 240,
    "limit": 50,
    "offset": 0
  }
}
```

## Programs API

### GET /api/programs

Fetches programs with optional filtering.

**Query Parameters:**
- `facultyId` (optional): Filter programs by faculty
- `name` (optional): Filter programs by name

**Response Example:**
```json
{
  "programs": [
    {
      "id": "program-uuid",
      "name": "Computer Science",
      "description": "...",
      "facultyId": "faculty-uuid",
      "faculty": {
        "id": "faculty-uuid",
        "name": "Mathematics",
        "description": "..."
      },
      "degrees": [...]
    }
  ]
}
```

### GET /api/programs/:id

Fetches a specific program by ID with all related data.

**Response Example:**
```json
{
  "program": {
    "id": "program-uuid",
    "name": "Computer Science",
    "description": "...",
    "facultyId": "faculty-uuid",
    "faculty": {
      "id": "faculty-uuid",
      "name": "Mathematics",
      "description": "..."
    },
    "degrees": [
      {
        "id": "degree-uuid",
        "name": "Bachelor of Computer Science",
        "description": "...",
        "programId": "program-uuid",
        "requirementSets": [...]
      }
    ]
  }
}
```

## Faculties API

### GET /api/faculties

Fetches all faculties.

**Response Example:**
```json
{
  "faculties": [
    {
      "id": "faculty-uuid",
      "name": "Mathematics",
      "description": "...",
      "programs": [...]
    }
  ]
}
```

## Plans API

### GET /api/plans

Fetches all plans for the authenticated user.

**Response Example:**
```json
{
  "plans": [
    {
      "id": "plan-uuid",
      "name": "My CS Degree Plan",
      "userId": "user-uuid",
      "created": "2025-03-05T15:30:00.000Z",
      "updated": "2025-03-05T16:45:00.000Z",
      "degrees": [...],
      "courses": [...]
    }
  ]
}
```

### POST /api/plans

Creates a new plan for the authenticated user.

**Request Body:**
```json
{
  "name": "My New Plan"
}
```

**Response Example:**
```json
{
  "plan": {
    "id": "plan-uuid",
    "name": "My New Plan",
    "userId": "user-uuid",
    "created": "2025-03-05T15:30:00.000Z",
    "updated": "2025-03-05T15:30:00.000Z"
  }
}
```

### GET /api/plans/:id

Fetches a specific plan by ID for the authenticated user.

**Response Example:**
```json
{
  "plan": {
    "id": "plan-uuid",
    "name": "My CS Degree Plan",
    "userId": "user-uuid",
    "created": "2025-03-05T15:30:00.000Z",
    "updated": "2025-03-05T16:45:00.000Z",
    "degrees": [...],
    "courses": [...]
  }
}
```

### PUT /api/plans/:id

Updates a specific plan for the authenticated user.

**Request Body:**
```json
{
  "name": "Updated Plan Name"
}
```

**Response Example:**
```json
{
  "plan": {
    "id": "plan-uuid",
    "name": "Updated Plan Name",
    "userId": "user-uuid",
    "created": "2025-03-05T15:30:00.000Z",
    "updated": "2025-03-05T17:00:00.000Z"
  }
}
```

### DELETE /api/plans/:id

Deletes a specific plan and all associated data.

**Response Example:**
```json
{
  "success": true
}
```

## Plan Courses API

### GET /api/plans/:id/courses

Fetches all courses in a plan.

**Response Example:**
```json
{
  "planCourses": [
    {
      "id": "plan-course-uuid",
      "planId": "plan-uuid",
      "courseId": "course-uuid",
      "course": {
        "id": "course-uuid",
        "courseCode": "MATH",
        "catalogNumber": "135",
        "title": "Algebra for Honours Mathematics",
        "description": "...",
        "units": 0.5,
        "prerequisites": "...",
        "corequisites": null,
        "antirequisites": null
      },
      "term": "Fall 2025",
      "status": "PLANNED",
      "grade": null
    }
  ]
}
```

### POST /api/plans/:id/courses

Adds a course to a plan.

**Request Body:**
```json
{
  "courseId": "course-uuid",
  "term": "Fall 2025",
  "status": "PLANNED",
  "grade": null
}
```

**Response Example:**
```json
{
  "planCourse": {
    "id": "plan-course-uuid",
    "planId": "plan-uuid",
    "courseId": "course-uuid",
    "course": {...},
    "term": "Fall 2025",
    "status": "PLANNED",
    "grade": null
  }
}
```

### PUT /api/plans/:id/courses/:courseId

Updates a course in a plan.

**Request Body:**
```json
{
  "term": "Winter 2026",
  "status": "COMPLETED",
  "grade": "90"
}
```

**Response Example:**
```json
{
  "planCourse": {
    "id": "plan-course-uuid",
    "planId": "plan-uuid",
    "courseId": "course-uuid",
    "course": {...},
    "term": "Winter 2026",
    "status": "COMPLETED",
    "grade": "90"
  }
}
```

### DELETE /api/plans/:id/courses/:courseId

Removes a course from a plan.

**Response Example:**
```json
{
  "success": true
}
```