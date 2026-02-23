"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getProgram } from "@/lib/api";
import {
  Program,
  Degree,
  RequirementSection,
  Requirement,
  formatCredentialCategory,
  formatCourseCode,
} from "@/types";
import { ArrowLeft, GraduationCap, BookOpen, ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgram = async () => {
      setIsLoading(true);
      const response = await getProgram(programId);
      setIsLoading(false);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.data?.program) {
        setProgram(response.data.program);
      }
    };

    fetchProgram();
  }, [programId]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container py-10">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading program...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container py-10">
          <div className="text-center py-12">
            <p className="text-destructive">{error || "Program not found"}</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/programs")}>
              Back to Programs
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
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => router.push("/programs")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Programs
          </Button>

          {/* Program header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{program.name}</h1>
            {program.faculties && program.faculties.length > 0 && (
              <div className="flex gap-2 mt-2">
                {program.faculties.map((f) => (
                  <Badge key={f.id} variant="secondary">
                    {f.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Degrees */}
          {program.degrees && program.degrees.length > 0 ? (
            <div className="space-y-8">
              {program.degrees.map((degree) => (
                <DegreeCard key={degree.id} degree={degree} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No degrees found for this program.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function DegreeCard({ degree }: { degree: Degree }) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const metadata = [
    { label: "Systems of Study", value: degree.systemsOfStudy },
    { label: "Declaration Requirements", value: degree.declarationRequirements },
    { label: "Minimum Averages", value: degree.minimumAverages },
    { label: "Graduation Requirements", value: degree.graduationRequirements },
    { label: "Additional Constraints", value: degree.additionalConstraints },
    { label: "Student Audience", value: degree.studentAudience },
    { label: "Offered By", value: degree.offeredBy },
    { label: "Notes", value: degree.notes },
  ].filter((m) => m.value);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <GraduationCap className="h-6 w-6 text-primary" />
          <div>
            <CardTitle className="text-xl">{degree.name}</CardTitle>
            <div className="flex gap-2 mt-1">
              <Badge>{formatCredentialCategory(degree.credentialCategory)}</Badge>
              <Badge variant="outline">{degree.credentialType}</Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Metadata */}
        {metadata.length > 0 && (
          <div className="space-y-3">
            {metadata.map((m) => (
              <div key={m.label}>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Requirement Sections */}
        {degree.sections && degree.sections.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
              <BookOpen className="h-5 w-5" />
              Requirement Sections
            </h3>
            <div className="space-y-2">
              {degree.sections.map((section) => (
                <div key={section.id} className="border rounded-md">
                  <button
                    className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => toggleSection(section.id)}
                  >
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="h-4 w-4 shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{section.label}</span>
                  </button>
                  {expandedSections.has(section.id) && section.requirementRoot && (
                    <div className="px-4 pb-3 border-t">
                      <div className="pt-3">
                        <RequirementTreeDisplay node={section.requirementRoot} />
                      </div>
                    </div>
                  )}
                  {expandedSections.has(section.id) && !section.requirementRoot && (
                    <div className="px-4 pb-3 border-t">
                      <p className="text-sm text-muted-foreground pt-3 italic">
                        No detailed requirements available for this section.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RequirementTreeDisplay({ node, depth = 0 }: { node: Requirement; depth?: number }) {
  const hasChildren = node.children && node.children.length > 0;

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
            <Link href={`/courses/${encodeURIComponent(node.courseCode || "")}`}>
              <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono hover:underline cursor-pointer">
                {node.courseCode ? formatCourseCode(node.courseCode) : "Unknown"}
              </code>
            </Link>
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
              <RequirementTreeDisplay key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
