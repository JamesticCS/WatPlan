"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { addDegreeToPlan, getFaculties, getPrograms } from "@/lib/api";
import { Degree, Faculty, Program, formatCredentialCategory } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { X, Search, CheckCircle, ChevronLeft, GraduationCap } from "lucide-react";

interface PlanAddProgramProps {
  planId: string;
  onProgramAdded: () => void;
}

export function PlanAddProgram({ planId, onProgramAdded }: PlanAddProgramProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedDegree, setSelectedDegree] = useState<Degree | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'faculty' | 'program' | 'degree'>('faculty');
  const { toast } = useToast();

  // Load faculties on open
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setIsLoading(true);
      const response = await getFaculties();
      setIsLoading(false);
      if (response.data?.faculties) {
        setFaculties(response.data.faculties);
      }
    };
    load();
  }, [isOpen]);

  // Load programs when faculty selected or search changes
  useEffect(() => {
    if (!isOpen) return;
    if (step === 'faculty' && !searchQuery) return;

    const load = async () => {
      setIsLoading(true);
      const response = await getPrograms({
        facultyId: selectedFaculty?.id || undefined,
        name: searchQuery || undefined,
      });
      setIsLoading(false);
      if (response.data?.programs) {
        setPrograms(response.data.programs);
      }
    };
    load();
  }, [isOpen, selectedFaculty, searchQuery, step]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSearchQuery("");
        setSelectedFaculty(null);
        setSelectedProgram(null);
        setSelectedDegree(null);
        setStep('faculty');
      }, 300);
    }
  }, [isOpen]);

  const handleFacultySelect = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setStep('program');
  };

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    setSearchQuery("");
    setStep('degree');
  };

  const handleDegreeSelect = (degree: Degree) => {
    setSelectedDegree(degree);
  };

  const handleBack = () => {
    if (step === 'degree') {
      setSelectedDegree(null);
      setStep('program');
    } else if (step === 'program') {
      setSelectedFaculty(null);
      setSelectedProgram(null);
      setStep('faculty');
    }
  };

  const handleAddDegree = async () => {
    if (!selectedDegree) return;

    setIsLoading(true);
    const response = await addDegreeToPlan(planId, {
      degreeId: selectedDegree.id,
    });
    setIsLoading(false);

    if (response.error) {
      toast({
        title: "Error",
        description: `Failed to add program: ${response.error}`,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Program added",
      description: `Added ${selectedDegree.name} to your plan`,
    });

    setIsOpen(false);
    onProgramAdded();
  };

  // Get a badge color based on credential category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'HONOURS': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'JOINT_HONOURS': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
      case 'GENERAL': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      case 'MINOR': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'SPECIALIZATION': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'OPTION': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'DOUBLE_DEGREE': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'DIPLOMA': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'CERTIFICATE': return 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200';
      case 'DEGREE_REQUIREMENTS': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter programs/degrees by search
  const filteredPrograms = searchQuery
    ? programs.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.degrees?.some(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : programs;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full" aria-label="Add Program">
          Add Program
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'faculty' && 'Select a Faculty'}
            {step === 'program' && `Programs in ${selectedFaculty?.name || 'Search Results'}`}
            {step === 'degree' && `Select a Degree - ${selectedProgram?.name || ''}`}
          </DialogTitle>
        </DialogHeader>

        {/* Search bar */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search programs by name..."
            className="pl-9 pr-4"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value) setStep('program');
            }}
          />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-gray-200 flex items-center justify-center"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Back button */}
        {step !== 'faculty' && !searchQuery && (
          <Button variant="ghost" size="sm" onClick={handleBack} className="mb-2 w-fit">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        )}

        {/* Content */}
        <div className="h-[400px] overflow-y-auto space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}

          {/* Faculty list */}
          {!isLoading && step === 'faculty' && !searchQuery && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {faculties.map((faculty) => (
                <div
                  key={faculty.id}
                  className="p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => handleFacultySelect(faculty)}
                >
                  <h4 className="font-medium">{faculty.name.replace('Faculty of ', '')}</h4>
                  {faculty.programs && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {faculty.programs.length} program{faculty.programs.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Program list */}
          {!isLoading && (step === 'program' || searchQuery) && (
            <div className="space-y-2">
              {filteredPrograms.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No programs found.
                </p>
              )}
              {filteredPrograms.map((program) => (
                <div
                  key={program.id}
                  className="p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer"
                  onClick={() => handleProgramSelect(program)}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <h4 className="font-medium">{program.name}</h4>
                  </div>
                  {program.faculties && program.faculties.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      {program.faculties.map(f => f.name.replace('Faculty of ', '')).join(', ')}
                    </p>
                  )}
                  {program.degrees && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-6">
                      {program.degrees.slice(0, 4).map((d) => (
                        <Badge key={d.id} variant="outline" className={`text-xs ${getCategoryColor(d.credentialCategory)}`}>
                          {formatCredentialCategory(d.credentialCategory)}
                        </Badge>
                      ))}
                      {program.degrees.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{program.degrees.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Degree list within selected program */}
          {!isLoading && step === 'degree' && !searchQuery && selectedProgram?.degrees && (
            <div className="space-y-2">
              {selectedProgram.degrees.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No degrees available for this program.
                </p>
              )}
              {selectedProgram.degrees.map((degree) => (
                <div
                  key={degree.id}
                  className={`p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${selectedDegree?.id === degree.id ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => handleDegreeSelect(degree)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-medium">{degree.name}</h4>
                        <Badge className={`text-xs ${getCategoryColor(degree.credentialCategory)}`}>
                          {formatCredentialCategory(degree.credentialCategory)}
                        </Badge>
                      </div>
                      {degree.credentialType && (
                        <p className="text-xs text-muted-foreground mt-1">{degree.credentialType}</p>
                      )}
                    </div>
                    {selectedDegree?.id === degree.id && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selectedDegree || isLoading}
            onClick={handleAddDegree}
          >
            Add to Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
