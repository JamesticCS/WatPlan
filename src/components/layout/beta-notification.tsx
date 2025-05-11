"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface BetaNotificationProps {
  planId: string;
}

export function BetaNotification({ planId }: BetaNotificationProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if we've shown this notification before for this plan
    const notificationShown = localStorage.getItem(`beta-notification-${planId}`);
    
    if (!notificationShown) {
      // Show notification and mark as shown
      setOpen(true);
      localStorage.setItem(`beta-notification-${planId}`, "true");
    }
  }, [planId]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <DialogTitle>WatPlan Beta</DialogTitle>
          </div>
          <DialogDescription>
            Welcome to WatPlan Beta! We're still working on refining the platform, so some features might not be fully functional yet.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <p className="text-sm mb-3">
            Current limitations:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>Degree requirement validation is in development</li>
            <li>Program information may be incomplete</li>
            <li>Some course details might be missing</li>
          </ul>
          <p className="text-sm mt-4">
            Check our{" "}
            <Link 
              href="https://github.com/JamesticCS/WatPlan" 
              target="_blank" 
              className="text-blue-600 hover:underline"
            >
              GitHub repository
            </Link>{" "}
            for updates and to report any issues you encounter.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => setOpen(false)}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}