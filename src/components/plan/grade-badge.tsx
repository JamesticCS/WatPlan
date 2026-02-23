"use client";

import { Badge } from "@/components/ui/badge";
import { CourseWithStatus } from "@/types";

export function getStatusBadge(status: CourseWithStatus["status"]) {
  switch (status) {
    case "COMPLETED":
      return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
    case "PLANNED":
      return <Badge variant="outline">Planned</Badge>;
    case "FAILED":
      return <Badge className="bg-red-500 hover:bg-red-600">Failed</Badge>;
    case "DROPPED":
      return <Badge className="bg-orange-500 hover:bg-orange-600">Dropped</Badge>;
    case "BACKLOG":
      return <Badge variant="outline" className="text-muted-foreground">Backlog</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function GradeBadge({ course }: { course: CourseWithStatus }) {
  if (!course.gradeLabel && course.gradeNumeric == null) return null;

  const colorClass =
    course.gradeLabel === 'CR' ? 'bg-green-100 text-green-800'
    : course.gradeLabel === 'NCR' ? 'bg-red-100 text-red-800'
    : course.gradeNumeric != null
      ? course.gradeNumeric >= 80
        ? 'bg-green-100 text-green-800'
        : course.gradeNumeric >= 70
          ? 'bg-blue-100 text-blue-800'
          : course.gradeNumeric >= 60
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
      : 'bg-gray-100 text-gray-800';

  const label =
    course.gradeLabel === 'CR' ? 'CR'
    : course.gradeLabel === 'NCR' ? 'NCR'
    : course.gradeNumeric != null ? `${course.gradeNumeric}%`
    : course.gradeLabel;

  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
}
