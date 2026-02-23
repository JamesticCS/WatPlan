"use client";

import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCourse } from "@/lib/api";
import { Course, Requirement, formatCourseCode } from "@/types";
import { ArrowLeft, BookOpen, AlertTriangle, Info } from "lucide-react";

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const code = decodeURIComponent(params.code as string);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCourse = async () => {
      setIsLoading(true);
      const response = await getCourse(code);
      setIsLoading(false);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data?.course) {
        setCourse(response.data.course);
      }
    };

    fetchCourse();
  }, [code]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container py-10">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container py-10">
          <div className="text-center py-12">
            <p className="text-destructive">{error || 'Course not found'}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/courses')}>
              Back to Courses
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="max-w-3xl mx-auto">
          {/* Back button */}
          <Button variant="ghost" size="sm" onClick={() => router.push('/courses')} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Courses
          </Button>

          {/* Course header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{formatCourseCode(course.code)}</h1>
            <h2 className="text-xl text-muted-foreground mt-1">{course.name}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
              <Badge>{course.units} unit{course.units !== 1 ? 's' : ''}</Badge>
              {course.subjectRef && (
                <Badge variant="outline">{course.subjectRef.name}</Badge>
              )}
              {course.subjectRef?.faculty && (
                <Badge variant="secondary">{course.subjectRef.faculty.name}</Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{course.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Prerequisites */}
          {course.prerequisiteRoot && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Prerequisites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RequirementTreeDisplay node={course.prerequisiteRoot} />
              </CardContent>
            </Card>
          )}

          {/* Corequisites */}
          {course.corequisiteRoot && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Corequisites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RequirementTreeDisplay node={course.corequisiteRoot} />
              </CardContent>
            </Card>
          )}

          {/* Anti-requisites */}
          {course.antiRequisiteText && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Anti-requisites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{course.antiRequisiteText}</p>
              </CardContent>
            </Card>
          )}

          {/* Additional info */}
          {(course.specialCourseGrading || course.specialConsentToAdd || course.specialConsentToDrop || (course.crossListedWith && course.crossListedWith.length > 0)) && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {course.specialCourseGrading && (
                  <div>
                    <p className="text-sm font-medium">Special Course Grading</p>
                    <p className="text-sm text-muted-foreground">{course.specialCourseGrading}</p>
                  </div>
                )}
                {course.specialConsentToAdd && (
                  <div>
                    <p className="text-sm font-medium">Consent to Add</p>
                    <p className="text-sm text-muted-foreground">{course.specialConsentToAdd}</p>
                  </div>
                )}
                {course.specialConsentToDrop && (
                  <div>
                    <p className="text-sm font-medium">Consent to Drop</p>
                    <p className="text-sm text-muted-foreground">{course.specialConsentToDrop}</p>
                  </div>
                )}
                {course.crossListedWith && course.crossListedWith.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Cross-listed with</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {course.crossListedWith.map((code) => (
                        <Badge key={code} variant="outline" className="text-xs">
                          {formatCourseCode(code)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

// Recursive tree display for prerequisites/corequisites
function RequirementTreeDisplay({ node, depth = 0 }: { node: Requirement; depth?: number }) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className={depth > 0 ? 'ml-4 border-l pl-3' : ''}>
      <div className="py-0.5">
        {node.logicType === 'ALL' && hasChildren && (
          <p className="text-sm font-medium text-muted-foreground">
            {node.label || 'All of the following:'}
          </p>
        )}
        {node.logicType === 'N_OF' && hasChildren && (
          <p className="text-sm font-medium text-muted-foreground">
            {node.label && !/^\d+$/.test(node.label.trim())
              ? node.label
              : `Complete ${node.n || '?'} of the following`}
          </p>
        )}
        {node.logicType === 'COURSE' && (
          <span className="text-sm">
            <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
              {node.courseCode ? formatCourseCode(node.courseCode) : 'Unknown'}
            </code>
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
        {node.logicType === 'UNITS' && (
          <p className="text-sm">
            {node.unitsRequired} units
            {node.subjectRestriction && ` in ${node.subjectRestriction}`}
            {node.levelRestriction && ` at ${node.levelRestriction}-level`}
          </p>
        )}
        {node.logicType === 'TEXT_RULE' && (
          <p className="text-sm text-muted-foreground italic">
            {node.text || node.label || 'See academic calendar'}
          </p>
        )}

        {hasChildren && (
          <div className="mt-1">
            {node.children!.map((child) => (
              <RequirementTreeDisplay key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
