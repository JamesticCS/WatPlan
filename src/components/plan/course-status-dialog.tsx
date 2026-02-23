"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CourseWithStatus, formatCourseCode } from "@/types";

interface CourseStatusDialogProps {
  open: boolean;
  course: CourseWithStatus | null;
  status: string;
  gradeNumeric: string;
  isSaving: boolean;
  onStatusChange: (status: string) => void;
  onGradeChange: (grade: string) => void;
  onSave: () => void;
  onClose: () => void;
}

export function CourseStatusDialog({
  open,
  course,
  status,
  gradeNumeric,
  isSaving,
  onStatusChange,
  onGradeChange,
  onSave,
  onClose,
}: CourseStatusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {course ? formatCourseCode(course.code) : 'Edit Course'}
          </DialogTitle>
          <DialogDescription>
            {course?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="DROPPED">Dropped</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "COMPLETED" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Grade (optional)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={gradeNumeric}
                  onChange={(e) => onGradeChange(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
