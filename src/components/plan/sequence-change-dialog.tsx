"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangleIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CoopSequence as CoopSequenceType } from "@/types";

const coopSequenceMap: Record<string, string> = {
  NO_COOP: "No Co-op",
  SEQUENCE_1: "Sequence 1",
  SEQUENCE_2: "Sequence 2",
  SEQUENCE_3: "Sequence 3",
  SEQUENCE_4: "Sequence 4",
  CUSTOM: "Custom",
};

interface SequenceChangeDialogProps {
  open: boolean;
  pendingSequence: CoopSequenceType | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SequenceChangeDialog({
  open,
  pendingSequence,
  onConfirm,
  onCancel,
}: SequenceChangeDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => { if (!o) onCancel(); }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
            Change Co-op Sequence?
          </DialogTitle>
          <DialogDescription>
            Changing your co-op sequence will remove all courses from your schedule. You'll need to
            redistribute them according to your new sequence pattern.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm font-medium text-muted-foreground">
            New co-op sequence: <span className="font-bold text-foreground">{pendingSequence ? coopSequenceMap[pendingSequence] : ''}</span>
          </p>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" variant="default" onClick={onConfirm} className="gap-1">
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
