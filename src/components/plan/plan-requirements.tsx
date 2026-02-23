"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPlanRequirements, updatePlanRequirements, toggleRequirementManual } from "@/lib/api";
import { RefreshCw, ChevronRight, ChevronDown, CheckCircle2, Circle, Loader2, CalendarClock, FileText, MinusCircle, Square, CheckSquare, Info } from "lucide-react";
import { Requirement, RequirementSection, formatCourseCode } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface PlanRequirementsProps {
  planId: string;
  planDegreeId: string;
  onRequirementsUpdated?: () => void;
}

export function PlanRequirements({
  planId,
  planDegreeId,
  onRequirementsUpdated
}: PlanRequirementsProps) {
  const [sections, setSections] = useState<RequirementSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const fetchRequirements = useCallback(async () => {
    const response = await getPlanRequirements(planId, planDegreeId);
    if (response.data?.sections) {
      setSections(response.data.sections);
    }
  }, [planId, planDegreeId]);

  // Fetch requirements on mount
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchRequirements();
      setIsLoading(false);
    };
    load();
  }, [fetchRequirements]);

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

      // Update local sections with response data
      if (response.data?.sections) {
        setSections(response.data.sections);
      }

      toast({
        title: "Requirements updated",
        description: "Your degree requirements have been updated based on your current courses",
      });

      if (onRequirementsUpdated) {
        onRequirementsUpdated();
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleManual = async (requirementId: string, isCompleted: boolean) => {
    // Call API then re-fetch to get updated parent progress
    const response = await toggleRequirementManual(planId, planDegreeId, requirementId, isCompleted);
    if (response.error) {
      toast({ title: "Error", description: response.error, variant: "destructive" });
      return;
    }
    await fetchRequirements();
  };

  return (
    <div className="space-y-4">
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

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground px-1">
        <span className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-500" /> Completed
        </span>
        <span className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 text-blue-500" /> In Progress
        </span>
        <span className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3 text-amber-500" /> Planned
        </span>
        <span className="flex items-center gap-1">
          <MinusCircle className="h-3 w-3 text-muted-foreground/50" /> Not Started
        </span>
        <span className="flex items-center gap-1">
          <Square className="h-3 w-3 text-muted-foreground" /> Manual
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-8 border rounded-md">
          <div className="h-6 w-6 border-3 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading requirements...</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="text-center py-8 border rounded-md">
          <p className="text-muted-foreground">No requirements found for this program.</p>
        </div>
      ) : (
        groupSections(sections).map((item) => {
          if ('children' in item) {
            return <SectionGroupCard key={item.parent.id} group={item} onToggleManual={handleToggleManual} />;
          }
          return <SectionCard key={item.id} section={item} onToggleManual={handleToggleManual} />;
        })
      )}
    </div>
  );
}

// ─── Section Grouping ──────────────────────────────────────────────────────

interface SectionGroup {
  parent: RequirementSection;
  children: RequirementSection[];
}

function groupSections(sections: RequirementSection[]): (RequirementSection | SectionGroup)[] {
  const result: (RequirementSection | SectionGroup)[] = [];
  const consumed = new Set<string>();

  for (const section of sections) {
    if (consumed.has(section.id)) continue;

    // Check if this section is a parent constraint (leaf TEXT_RULE with children sharing prefix)
    const isLeafTextRule = section.requirementRoot?.logicType === 'TEXT_RULE'
      && (!section.requirementRoot.children || section.requirementRoot.children.length === 0);

    if (isLeafTextRule) {
      const children = sections.filter(
        s => s.id !== section.id && s.label.startsWith(section.label + ' - ')
      );
      if (children.length > 0) {
        consumed.add(section.id);
        children.forEach(c => consumed.add(c.id));
        result.push({ parent: section, children });
        continue;
      }
    }

    result.push(section);
  }

  return result;
}

function SectionGroupCard({ group, onToggleManual }: { group: SectionGroup; onToggleManual: (id: string, isCompleted: boolean) => void }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Combined progress: average of child section roots
  const childProgresses = group.children.map(c => c.requirementRoot?.progress ?? 0);
  const avgProgress = childProgresses.length > 0
    ? childProgresses.reduce((a, b) => a + b, 0) / childProgresses.length
    : 0;

  // Derive combined status from children
  const childStatuses = group.children.map(c => c.requirementRoot?.status ?? 'NOT_STARTED');
  const combinedStatus = avgProgress >= 1 ? 'COMPLETED'
    : childStatuses.some(s => s === 'IN_PROGRESS' || s === 'COMPLETED') ? 'IN_PROGRESS'
    : childStatuses.some(s => s === 'PLANNED') ? 'PLANNED'
    : 'NOT_STARTED';

  const constraintText = group.parent.requirementRoot?.text || group.parent.requirementRoot?.label || '';

  return (
    <div className="border rounded-md overflow-hidden">
      {/* Group header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{group.parent.label}</span>
          <StatusBadge status={combinedStatus} />
        </div>
        <span className="text-sm text-muted-foreground">
          {Math.round(avgProgress * 100)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="w-full h-1.5 bg-muted overflow-hidden rounded-full">
          <div
            className={`h-full transition-all duration-500 ${
              combinedStatus === 'COMPLETED' ? 'bg-green-500' :
              combinedStatus === 'IN_PROGRESS' ? 'bg-blue-500' :
              combinedStatus === 'PLANNED' ? 'bg-amber-400' : 'bg-muted'
            }`}
            style={{ width: `${avgProgress * 100}%` }}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Constraint context note */}
          {constraintText && (
            <div className="flex items-start gap-2 px-3 py-2 rounded bg-muted/30 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{constraintText}</span>
            </div>
          )}

          {/* Child sections with shortened labels */}
          {group.children.map((child) => {
            const shortLabel = child.label.startsWith(group.parent.label + ' - ')
              ? child.label.slice(group.parent.label.length + 3)
              : child.label;
            return (
              <SectionCard
                key={child.id}
                section={{ ...child, label: shortLabel }}
                onToggleManual={onToggleManual}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionCard({ section, onToggleManual }: { section: RequirementSection; onToggleManual: (id: string, isCompleted: boolean) => void }) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Calculate overall section progress from root node
  const rootProgress = section.requirementRoot?.progress ?? 0;
  const rootStatus = section.requirementRoot?.status ?? 'NOT_STARTED';

  return (
    <div className="border rounded-md overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{section.label}</span>
          <StatusBadge status={rootStatus} />
        </div>
        <span className="text-sm text-muted-foreground">
          {Math.round(rootProgress * 100)}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="w-full h-1.5 bg-muted overflow-hidden rounded-full">
          <div
            className={`h-full transition-all duration-500 ${
              rootStatus === 'COMPLETED' ? 'bg-green-500' :
              rootStatus === 'IN_PROGRESS' ? 'bg-blue-500' :
              rootStatus === 'PLANNED' ? 'bg-amber-400' : 'bg-muted'
            }`}
            style={{ width: `${rootProgress * 100}%` }}
          />
        </div>
      </div>

      {isExpanded && section.requirementRoot && (
        <div className="px-4 pb-4">
          <RequirementTree node={section.requirementRoot} depth={0} onToggleManual={onToggleManual} />
        </div>
      )}
    </div>
  );
}

function RequirementTree({ node, depth, onToggleManual }: { node: Requirement; depth: number; onToggleManual: (id: string, isCompleted: boolean) => void }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isManualType = node.logicType === 'UNITS' || node.logicType === 'TEXT_RULE';

  return (
    <div className={`${depth > 0 ? 'ml-4 border-l pl-3' : ''}`}>
      <div className="py-1">
        {/* Node header */}
        <div
          className={`flex items-start gap-2 ${hasChildren ? 'cursor-pointer' : ''}`}
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          {isManualType ? (
            <ManualCheckbox node={node} onToggle={onToggleManual} />
          ) : hasChildren ? (
            <div className="flex items-center gap-1 flex-shrink-0">
              <StatusIcon status={node.status} />
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              )}
            </div>
          ) : (
            <StatusIcon status={node.status} />
          )}

          <div className="flex-1 min-w-0">
            <NodeContent node={node} />
          </div>

          {node.progress !== undefined && hasChildren && (
            <span className={`text-xs flex-shrink-0 ${
              node.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400 font-medium' :
              node.status === 'IN_PROGRESS' ? 'text-blue-600 dark:text-blue-400' :
              node.status === 'PLANNED' ? 'text-amber-600 dark:text-amber-400' :
              'text-muted-foreground'
            }`}>
              {Math.round(node.progress * 100)}%
            </span>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-1">
            {node.children!.map((child) => (
              <RequirementTree key={child.id} node={child} depth={depth + 1} onToggleManual={onToggleManual} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ManualCheckbox({ node, onToggle }: { node: Requirement; onToggle: (id: string, isCompleted: boolean) => void }) {
  const [isToggling, setIsToggling] = useState(false);
  const isChecked = node.status === 'COMPLETED';

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isToggling) return;
    setIsToggling(true);
    await onToggle(node.id, !isChecked);
    setIsToggling(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={isToggling}
      className={`mt-0.5 flex-shrink-0 transition-colors ${
        isToggling ? 'opacity-50' :
        isChecked ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {isChecked ? (
        <CheckSquare className="h-4 w-4" />
      ) : (
        <Square className="h-4 w-4" />
      )}
    </button>
  );
}

function NodeContent({ node }: { node: Requirement }) {
  switch (node.logicType) {
    case 'ALL':
      return (
        <span className="text-sm">
          {node.label || 'Complete all of the following'}
          {node.minGradeRequired != null && (
            <span className="text-xs text-muted-foreground ml-1">
              (min grade: {node.minGradeRequired}%)
            </span>
          )}
        </span>
      );

    case 'N_OF': {
      // label is sometimes just the number (e.g. "3") from the scraper — use the nice template instead
      const nOfLabel = node.label && !/^\d+$/.test(node.label.trim())
        ? node.label
        : `Complete ${node.n || node.label || '?'} of the following`;
      return (
        <span className="text-sm">
          {nOfLabel}
        </span>
      );
    }

    case 'COURSE':
      return (
        <span className="text-sm flex items-center gap-1.5">
          <code className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">
            {node.courseCode ? formatCourseCode(node.courseCode) : 'Unknown Course'}
          </code>
          {node.course && (
            <span className="text-muted-foreground text-xs truncate">
              {node.course.name}
            </span>
          )}
          {node.minGradeRequired != null && (
            <span className="text-xs text-orange-600 dark:text-orange-400">
              (min {node.minGradeRequired}%)
            </span>
          )}
        </span>
      );

    case 'UNITS':
      return (
        <span className={`text-sm ${node.status === 'COMPLETED' ? 'line-through text-muted-foreground' : ''}`}>
          {node.label || `${node.unitsRequired != null ? Number(node.unitsRequired).toFixed(1) : '?'} units`}
          {node.subjectRestriction && (
            <span className="text-xs text-muted-foreground ml-1">
              ({node.subjectRestriction})
            </span>
          )}
          {node.levelRestriction && (
            <span className="text-xs text-muted-foreground ml-1">
              {node.levelRestriction}-level
            </span>
          )}
        </span>
      );

    case 'TEXT_RULE':
      return (
        <span className={`text-sm ${node.status === 'COMPLETED' ? 'line-through text-muted-foreground' : 'text-muted-foreground italic'}`}>
          {node.text || node.label || 'See academic calendar for details'}
        </span>
      );

    default:
      return <span className="text-sm">{node.label || 'Unknown requirement'}</span>;
  }
}

function StatusBadge({ status }: { status?: string }) {
  switch (status) {
    case 'COMPLETED':
      return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20">Completed</Badge>;
    case 'IN_PROGRESS':
      return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20">In Progress</Badge>;
    case 'PLANNED':
      return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20">Planned</Badge>;
    default:
      return <Badge variant="outline" className="text-muted-foreground">Not Started</Badge>;
  }
}

function StatusIcon({ status }: { status?: string }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />;
    case 'IN_PROGRESS':
      return <Loader2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />;
    case 'PLANNED':
      return <CalendarClock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />;
    default:
      return <MinusCircle className="h-4 w-4 text-muted-foreground/50 mt-0.5 flex-shrink-0" />;
  }
}
