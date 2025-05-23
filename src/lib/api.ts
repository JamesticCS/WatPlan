import { 
  ApiResponse, 
  Course, 
  Faculty, 
  Plan, 
  PlanCourse, 
  PlanDegree,
  Program,
  Requirement
} from "@/types";

// Base fetch function with error handling
async function fetchApi<T>(
  url: string, 
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || 'An error occurred',
        status: response.status,
      };
    }

    return { data: data as T };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'An error occurred',
    };
  }
}

// Courses API
export async function getCourses(
  params?: { courseCode?: string; limit?: number; offset?: number }
): Promise<ApiResponse<{ courses: Course[]; pagination: { total: number; limit: number; offset: number } }>> {
  const searchParams = new URLSearchParams();
  if (params?.courseCode) searchParams.append('courseCode', params.courseCode);
  
  // Default to 20 results if not specified (increased to show more search results)
  const limit = params?.limit || 20;
  searchParams.append('limit', limit.toString());
  
  if (params?.offset) searchParams.append('offset', params.offset.toString());

  const url = `/api/courses${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return fetchApi(url);
}

// Faculties API
export async function getFaculties(): Promise<ApiResponse<{ faculties: Faculty[] }>> {
  return fetchApi('/api/faculties');
}

// Programs API
export async function getPrograms(
  params?: { facultyId?: string; name?: string }
): Promise<ApiResponse<{ programs: Program[] }>> {
  const searchParams = new URLSearchParams();
  if (params?.facultyId) searchParams.append('facultyId', params.facultyId);
  if (params?.name) searchParams.append('name', params.name);

  const url = `/api/programs${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  return fetchApi(url);
}

export async function getProgram(id: string): Promise<ApiResponse<{ program: Program }>> {
  return fetchApi(`/api/programs/${id}`);
}

// Plans API
export async function getPlans(): Promise<ApiResponse<{ plans: Plan[] }>> {
  return fetchApi('/api/plans');
}

export async function getPlan(id: string): Promise<ApiResponse<{ plan: Plan }>> {
  return fetchApi(`/api/plans/${id}`);
}

export async function createPlan(data: { name: string }): Promise<ApiResponse<{ plan: Plan }>> {
  return fetchApi('/api/plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function updatePlan(
  id: string, 
  data: { 
    name?: string;
    academicCalendarYear?: string;
  }
): Promise<ApiResponse<{ plan: Plan }>> {
  return fetchApi(`/api/plans/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function deletePlan(id: string): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/api/plans/${id}`, {
    method: 'DELETE',
  });
}

export async function duplicatePlan(id: string, data: { name: string }): Promise<ApiResponse<{ plan: Plan }>> {
  return fetchApi(`/api/plans/${id}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

// Plan Courses API
export async function getPlanCourses(planId: string): Promise<ApiResponse<{ planCourses: PlanCourse[] }>> {
  return fetchApi(`/api/plans/${planId}/courses`);
}

export async function addCourseToPlan(
  planId: string, 
  data: { 
    courseId: string; 
    term?: string; 
    termIndex?: number;
    status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED'; 
    grade?: string 
  }
): Promise<ApiResponse<{ planCourse: PlanCourse }>> {
  return fetchApi(`/api/plans/${planId}/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function updatePlanCourse(
  planId: string,
  courseId: string,
  data: {
    term?: string;
    termIndex?: number;
    status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
    grade?: string;
  }
): Promise<ApiResponse<{ planCourse: PlanCourse }>> {
  return fetchApi(`/api/plans/${planId}/courses/${courseId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function removeCourseFromPlan(
  planId: string,
  courseId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/api/plans/${planId}/courses/${courseId}`, {
    method: 'DELETE',
  });
}

// Plan Degrees API
export async function addDegreeToPlan(
  planId: string, 
  data: { 
    degreeId: string; 
    type: 'MAJOR' | 'MINOR' | 'SPECIALIZATION' | 'OPTION' | 'JOINT';
  }
): Promise<ApiResponse<{ planDegree: PlanDegree }>> {
  return fetchApi(`/api/plans/${planId}/degrees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function removeDegreeFromPlan(
  planId: string,
  planDegreeId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/api/plans/${planId}/degrees/${planDegreeId}`, {
    method: 'DELETE',
  });
}

// Requirements API
export async function getPlanRequirements(
  planId: string,
  planDegreeId: string
): Promise<ApiResponse<{ requirements: Requirement[] }>> {
  return fetchApi(`/api/plans/${planId}/degrees/${planDegreeId}/requirements`);
}

export async function updatePlanRequirements(
  planId: string,
  planDegreeId: string
): Promise<ApiResponse<{ requirements: Requirement[] }>> {
  return fetchApi(`/api/plans/${planId}/degrees/${planDegreeId}/requirements`, {
    method: 'PUT',
  });
}

export async function updateAllPlanRequirements(
  planId: string
): Promise<ApiResponse<{ success: boolean }>> {
  return fetchApi(`/api/plans/${planId}/requirements`, {
    method: 'PUT',
  });
}