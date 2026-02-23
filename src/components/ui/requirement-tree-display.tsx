"use client";

import Link from "next/link";
import { Requirement, formatCourseCode } from "@/types";

interface RequirementTreeDisplayProps {
  node: Requirement;
  depth?: number;
  linkCourses?: boolean;
}

export function RequirementTreeDisplay({ node, depth = 0, linkCourses = false }: RequirementTreeDisplayProps) {
  const hasChildren = node.children && node.children.length > 0;

  const courseCodeElement = node.logicType === "COURSE" ? (
    linkCourses ? (
      <Link href={`/courses/${encodeURIComponent(node.courseCode || "")}`}>
        <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono hover:underline cursor-pointer">
          {node.courseCode ? formatCourseCode(node.courseCode) : "Unknown"}
        </code>
      </Link>
    ) : (
      <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
        {node.courseCode ? formatCourseCode(node.courseCode) : "Unknown"}
      </code>
    )
  ) : null;

  return (
    <div className={depth > 0 ? "ml-4 border-l pl-3" : ""}>
      <div className="py-0.5">
        {node.logicType === "ALL" && hasChildren && (
          <p className="text-sm font-medium text-muted-foreground">
            {node.label || "All of the following:"}
          </p>
        )}
        {node.logicType === "N_OF" && hasChildren && (
          <p className="text-sm font-medium text-muted-foreground">
            {node.label && !/^\d+$/.test(node.label.trim())
              ? node.label
              : `Complete ${node.n || "?"} of the following`}
          </p>
        )}
        {node.logicType === "COURSE" && (
          <span className="text-sm">
            {courseCodeElement}
            {node.course && (
              <span className="text-muted-foreground ml-1.5">{node.course.name}</span>
            )}
            {node.minGradeRequired != null && (
              <span className="text-xs text-orange-600 dark:text-orange-400 ml-1">
                (min {node.minGradeRequired}%)
              </span>
            )}
          </span>
        )}
        {node.logicType === "UNITS" && (
          <p className="text-sm">
            {node.unitsRequired} units
            {node.subjectRestriction && ` in ${node.subjectRestriction}`}
            {node.levelRestriction && ` at ${node.levelRestriction}-level`}
          </p>
        )}
        {node.logicType === "TEXT_RULE" && (
          <p className="text-sm text-muted-foreground italic">
            {node.text || node.label || "See academic calendar"}
          </p>
        )}

        {hasChildren && (
          <div className="mt-1">
            {node.children!.map((child) => (
              <RequirementTreeDisplay key={child.id} node={child} depth={depth + 1} linkCourses={linkCourses} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
