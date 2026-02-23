"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUpIcon, GaugeIcon, StarIcon, ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { getCourse } from "@/lib/api";
import { Course, formatCourseCode } from "@/types";
import { RequirementTreeDisplay } from "@/components/ui/requirement-tree-display";

interface CourseDetailDialogProps {
  courseCode: string | null;
  onClose: () => void;
}

export function CourseDetailDialog({ courseCode, onClose }: CourseDetailDialogProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!courseCode) {
      setCourse(null);
      return;
    }

    setIsLoading(true);
    getCourse(courseCode).then((res) => {
      if (res.data?.course) {
        setCourse(res.data.course);
      }
      setIsLoading(false);
    });
  }, [courseCode]);

  const uwflowCode = courseCode?.toLowerCase().replace(/\s+/g, "") ?? "";

  return (
    <Dialog open={!!courseCode} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : course ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">
                {formatCourseCode(course.code)}
                <span className="font-normal text-muted-foreground ml-2">—</span>
                <span className="font-normal ml-2">{course.name}</span>
              </DialogTitle>
              <DialogDescription asChild>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="secondary">{course.units} units</Badge>
                  {course.subjectRef && (
                    <Badge variant="outline">{course.subjectRef.name}</Badge>
                  )}
                  {course.specialCourseGrading && (
                    <Badge variant="outline">{course.specialCourseGrading}</Badge>
                  )}
                </div>
              </DialogDescription>
            </DialogHeader>

            {/* UWFlow Ratings */}
            {course.uwflowRatingsCount != null && course.uwflowRatingsCount > 0 && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">UWFlow Ratings</h4>
                  <span className="text-xs text-muted-foreground">
                    {course.uwflowRatingsCount} ratings
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <RatingBar
                    label="Liked"
                    value={course.uwflowLiked ?? 0}
                    icon={<ThumbsUpIcon className="h-3.5 w-3.5" />}
                    color="green"
                  />
                  <RatingBar
                    label="Easy"
                    value={course.uwflowEasy ?? 0}
                    icon={<GaugeIcon className="h-3.5 w-3.5" />}
                    color="blue"
                  />
                  <RatingBar
                    label="Useful"
                    value={course.uwflowUseful ?? 0}
                    icon={<StarIcon className="h-3.5 w-3.5" />}
                    color="amber"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            {course.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{course.description}</p>
              </div>
            )}

            {/* Prerequisites */}
            {course.prerequisiteRoot && (
              <div>
                <h4 className="text-sm font-medium mb-1">Prerequisites</h4>
                <div className="border rounded-md p-3 bg-muted/30">
                  <RequirementTreeDisplay node={course.prerequisiteRoot} />
                </div>
              </div>
            )}

            {/* Corequisites */}
            {course.corequisiteRoot && (
              <div>
                <h4 className="text-sm font-medium mb-1">Corequisites</h4>
                <div className="border rounded-md p-3 bg-muted/30">
                  <RequirementTreeDisplay node={course.corequisiteRoot} />
                </div>
              </div>
            )}

            {/* Anti-requisites */}
            {course.antiRequisiteText && (
              <div>
                <h4 className="text-sm font-medium mb-1">Anti-requisites</h4>
                <p className="text-sm text-muted-foreground">{course.antiRequisiteText}</p>
              </div>
            )}

            {/* Cross-listed */}
            {course.crossListedWith && course.crossListedWith.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Cross-listed with</h4>
                <div className="flex gap-1 flex-wrap">
                  {course.crossListedWith.map((code) => (
                    <Badge key={code} variant="outline">{code}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* View on UWFlow */}
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`https://uwflow.com/course/${uwflowCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on UWFlow
                  <ExternalLinkIcon className="h-3.5 w-3.5 ml-1.5" />
                </a>
              </Button>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Course not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RatingBar({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "green" | "blue" | "amber";
}) {
  const percentage = Math.round(value * 100);
  const colorClasses = {
    green: "text-green-600 dark:text-green-400 bg-green-500/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/20",
  };
  const barClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
  };

  return (
    <div className="space-y-1">
      <div className={`flex items-center gap-1 text-xs ${colorClasses[color]?.split(" ")[0]}`}>
        {icon}
        <span>{label}</span>
        <span className="ml-auto font-medium">{percentage}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${barClasses[color]} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

