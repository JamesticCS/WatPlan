"use client";

import { Badge } from "@/components/ui/badge";

type Requirement = {
  id: string;
  name: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  progress: number;
};

interface PlanRequirementsProps {
  requirements: Requirement[];
}

export function PlanRequirements({ requirements }: PlanRequirementsProps) {
  const getStatusBadge = (status: Requirement["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500 hover:bg-green-600">Completed</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-500 hover:bg-blue-600">In Progress</Badge>;
      case "NOT_STARTED":
        return <Badge variant="outline">Not Started</Badge>;
    }
  };
  
  return (
    <div className="space-y-6">
      {requirements.map((requirement) => (
        <div key={requirement.id} className="border rounded-md p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
            <div>
              <div className="font-medium">{requirement.name}</div>
              <div className="flex items-center gap-2 mt-1">
                {getStatusBadge(requirement.status)}
                <span className="text-sm text-muted-foreground">{requirement.progress}% complete</span>
              </div>
            </div>
          </div>
          <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
            <div 
              className="h-full bg-primary"
              style={{ width: `${requirement.progress}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  );
}