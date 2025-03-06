"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updatePlanRequirements } from "@/lib/api";
import { RefreshCw } from "lucide-react";
import { Requirement } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface PlanRequirementsProps {
  requirements: Requirement[];
  planId: string;
  planDegreeId: string;
  onRequirementsUpdated?: () => void;
}

export function PlanRequirements({ 
  requirements,
  planId,
  planDegreeId,
  onRequirementsUpdated
}: PlanRequirementsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  
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

  const handleUpdateRequirements = async () => {
    setIsUpdating(true);
    try {
      const response = await updatePlanRequirements(planId, planDegreeId);
      
      if (response.error) {
        toast({
          title: "Error",
          description: `Failed to update requirements: ${response.error}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Requirements updated",
        description: "Your degree requirements have been updated based on your current courses",
      });

      if (onRequirementsUpdated) {
        onRequirementsUpdated();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-lg">Requirements</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleUpdateRequirements}
          disabled={isUpdating}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {requirements.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No requirements found for this program.</p>
        </div>
      ) : (
        requirements.map((requirement) => (
          <div key={requirement.id} className="border rounded-md p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
              <div>
                <div className="font-medium">{requirement.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(requirement.status)}
                  <span className="text-sm text-muted-foreground">{requirement.progress || 0}% complete</span>
                </div>
              </div>
            </div>
            <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
              <div 
                className="h-full bg-primary"
                style={{ width: `${requirement.progress || 0}%` }}
              ></div>
            </div>
            {requirement.description && (
              <p className="text-sm text-muted-foreground mt-3">{requirement.description}</p>
            )}
            
            {/* Display requirement details based on type */}
            <div className="mt-4 text-sm">
              {requirement.type === 'COURSE_LIST' && requirement.courses && requirement.courses.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium mb-1 text-xs uppercase text-muted-foreground">Required Courses:</p>
                  <div className="flex flex-wrap gap-1">
                    {requirement.courses.map(course => (
                      <span key={course.id} className="px-2 py-1 bg-muted rounded text-xs">
                        {course.courseCode} {course.catalogNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {requirement.type === 'UNITS' && (
                <div className="mt-2">
                  <p className="font-medium mb-1 text-xs uppercase text-muted-foreground">Required Units:</p>
                  <span className="px-2 py-1 bg-muted rounded text-xs">{requirement.unitsRequired} Units</span>
                  
                  {requirement.courseCodeRestriction && (
                    <div className="mt-2">
                      <p className="font-medium mb-1 text-xs uppercase text-muted-foreground">Course Codes:</p>
                      <div className="flex flex-wrap gap-1">
                        {requirement.courseCodeRestriction.split(',').map((code, i) => (
                          <span key={i} className="px-2 py-1 bg-muted rounded text-xs">{code.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {requirement.levelRestriction && (
                    <div className="mt-2">
                      <p className="font-medium mb-1 text-xs uppercase text-muted-foreground">Level Restriction:</p>
                      <span className="px-2 py-1 bg-muted rounded text-xs">{requirement.levelRestriction}</span>
                    </div>
                  )}
                </div>
              )}
              
              {requirement.type === 'MULTI_LIST' && (
                <div className="mt-2">
                  <p className="font-medium mb-1 text-xs uppercase text-muted-foreground">Requirements:</p>
                  <span className="px-2 py-1 bg-muted rounded text-xs mb-2 inline-block">
                    Complete {requirement.coursesRequired} courses from the specified lists
                  </span>
                  
                  {requirement.lists && requirement.lists.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {requirement.lists.map(list => (
                        <div key={list.id} className="border-l-2 border-muted pl-3 py-1">
                          <p className="text-xs font-medium">{list.name}</p>
                          {list.description && (
                            <p className="text-xs text-muted-foreground mt-1">{list.description}</p>
                          )}
                          {list.courses && list.courses.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {list.courses.map(course => (
                                <span key={course.id} className="px-2 py-1 bg-muted rounded text-xs">
                                  {course.courseCode} {course.catalogNumber}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}