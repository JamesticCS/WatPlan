import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { addDegreeToPlan, getFaculties, getPrograms, updatePlan } from "@/lib/api";
import { Degree, DegreeType, Faculty, Program } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { X, Search, CheckCircle, BookOpen, GraduationCap, Award, Calendar } from "lucide-react";

interface PlanAddProgramProps {
  planId: string;
  onProgramAdded: () => void;
}

export function PlanAddProgram({ planId, onProgramAdded }: PlanAddProgramProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [selectedDegree, setSelectedDegree] = useState<Degree | null>(null);
  const [selectedType, setSelectedType] = useState<DegreeType | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'faculty' | 'program' | 'degree' | 'type'>('faculty');
  const { toast } = useToast();
  
  // Load faculties on component mount
  useEffect(() => {
    const loadFaculties = async () => {
      setIsLoading(true);
      const response = await getFaculties();
      setIsLoading(false);
      
      if (response.error) {
        toast({
          title: "Error",
          description: `Failed to load faculties: ${response.error}`,
          variant: "destructive",
        });
        return;
      }
      
      if (response.data?.faculties) {
        setFaculties(response.data.faculties);
      }
    };
    
    if (isOpen) {
      loadFaculties();
    }
  }, [isOpen, toast]);
  
  // Load programs when faculty or search query changes
  useEffect(() => {
    const loadPrograms = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      const response = await getPrograms({ 
        facultyId: selectedFaculty || undefined,
        name: searchQuery || undefined
      });
      setIsLoading(false);
      
      if (response.error) {
        toast({
          title: "Error",
          description: `Failed to load programs: ${response.error}`,
          variant: "destructive",
        });
        return;
      }
      
      if (response.data?.programs) {
        setPrograms(response.data.programs);
      }
    };
    
    if (step === 'program' || searchQuery) {
      loadPrograms();
    }
  }, [selectedFaculty, searchQuery, isOpen, step, toast]);
  
  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSearchQuery("");
        setSelectedFaculty(null);
        setSelectedProgram(null);
        setSelectedDegree(null);
        setSelectedType(null);
        setStep('faculty');
      }, 300); // Add slight delay to prevent flickering during close animation
    }
  }, [isOpen]);
  
  // Handle faculty selection
  const handleFacultySelect = (facultyId: string) => {
    setSelectedFaculty(facultyId);
    setStep('program');
  };
  
  // Handle program selection
  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program);
    if (program.degrees.length === 1) {
      setSelectedDegree(program.degrees[0]);
      setStep('type');
    } else {
      setStep('degree');
    }
  };
  
  // Handle degree selection
  const handleDegreeSelect = (degree: Degree) => {
    setSelectedDegree(degree);
    setStep('type');
  };
  
  // Handle degree type selection
  const handleTypeSelect = (type: DegreeType) => {
    setSelectedType(type);
  };
  
  // Handle adding the program to the plan
  const handleAddProgram = async () => {
    if (!selectedDegree || !selectedType) {
      toast({
        title: "Error",
        description: "Please select a degree and type",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const response = await addDegreeToPlan(planId, {
      degreeId: selectedDegree.id,
      type: selectedType,
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
      description: `Added ${selectedDegree.name} (${selectedType.toLowerCase()}) to your plan`,
    });
    
    setIsOpen(false);
    onProgramAdded();
  };
  
  // Get degree type display text
  const getDegreeTypeDisplay = (type: DegreeType) => {
    switch (type) {
      case 'MAJOR': return 'Major';
      case 'MINOR': return 'Minor';
      case 'SPECIALIZATION': return 'Specialization';
      case 'OPTION': return 'Option';
      case 'JOINT': return 'Joint';
      default: return type;
    }
  };
  
  // Get icon based on degree type
  const getDegreeTypeIcon = (type: DegreeType) => {
    switch (type) {
      case 'MAJOR': return <GraduationCap className="h-4 w-4 mr-2" />;
      case 'MINOR': return <BookOpen className="h-4 w-4 mr-2" />;
      case 'SPECIALIZATION': return <Award className="h-4 w-4 mr-2" />;
      case 'OPTION': return <BookOpen className="h-4 w-4 mr-2" />;
      case 'JOINT': return <GraduationCap className="h-4 w-4 mr-2" />;
      default: return null;
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          Add Program
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a Program to Your Plan</DialogTitle>
        </DialogHeader>
        
        {/* Search bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search programs by name..."
            className="pl-9 pr-4"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
        
        {/* Selection breadcrumbs */}
        {(selectedFaculty || selectedProgram || selectedDegree || selectedType) && (
          <div className="flex flex-wrap gap-2 mb-4 animate-fadeIn">
            {selectedFaculty && faculties.find(f => f.id === selectedFaculty) && (
              <div className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                <span>{faculties.find(f => f.id === selectedFaculty)?.name}</span>
                <button 
                  className="ml-2 hover:bg-primary/20 rounded-full p-0.5"
                  onClick={() => {
                    setSelectedFaculty(null);
                    setSelectedProgram(null);
                    setSelectedDegree(null);
                    setSelectedType(null);
                    setStep('faculty');
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {selectedProgram && (
              <div className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                <span>{selectedProgram.name}</span>
                <button 
                  className="ml-2 hover:bg-primary/20 rounded-full p-0.5"
                  onClick={() => {
                    setSelectedProgram(null);
                    setSelectedDegree(null);
                    setSelectedType(null);
                    setStep('program');
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {selectedDegree && (
              <div className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                <span>{selectedDegree.name}</span>
                <button 
                  className="ml-2 hover:bg-primary/20 rounded-full p-0.5"
                  onClick={() => {
                    setSelectedDegree(null);
                    setSelectedType(null);
                    setStep('degree');
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            {selectedType && (
              <div className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                <span>{getDegreeTypeDisplay(selectedType)}</span>
                <button 
                  className="ml-2 hover:bg-primary/20 rounded-full p-0.5"
                  onClick={() => {
                    setSelectedType(null);
                    setStep('type');
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Content based on current step */}
        <div className="max-h-[50vh] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : searchQuery && programs.length > 0 ? (
            <div className="space-y-2 animate-fadeIn">
              <h3 className="text-sm font-medium mb-2">Search Results</h3>
              {programs.map((program) => (
                <div
                  key={program.id}
                  className={`p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${selectedProgram?.id === program.id ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => handleProgramSelect(program)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{program.name}</h4>
                      <p className="text-sm text-muted-foreground">{program.faculty?.name}</p>
                      {program.degrees.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {program.degrees.map((degree) => (
                            <Badge key={degree.id} variant="outline" className="text-xs">
                              {degree.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedProgram?.id === program.id && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : step === 'faculty' && faculties.length > 0 ? (
            <div className="space-y-2 animate-fadeIn">
              <h3 className="text-sm font-medium mb-2">Select a Faculty</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {faculties.map((faculty) => (
                  <div
                    key={faculty.id}
                    className={`p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${selectedFaculty === faculty.id ? 'border-primary bg-primary/10' : ''}`}
                    onClick={() => handleFacultySelect(faculty.id)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{faculty.name}</h4>
                      {selectedFaculty === faculty.id && (
                        <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                    {faculty.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{faculty.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : step === 'program' && programs.length > 0 ? (
            <div className="space-y-2 animate-fadeIn">
              <h3 className="text-sm font-medium mb-2">Select a Program</h3>
              {programs.map((program) => (
                <div
                  key={program.id}
                  className={`p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${selectedProgram?.id === program.id ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => handleProgramSelect(program)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{program.name}</h4>
                      {program.degrees.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {program.degrees.map((degree) => (
                            <Badge key={degree.id} variant="outline" className="text-xs">
                              {degree.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {selectedProgram?.id === program.id && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : step === 'degree' && selectedProgram ? (
            <div className="space-y-2 animate-fadeIn">
              <h3 className="text-sm font-medium mb-2">Select a Degree</h3>
              {selectedProgram.degrees.map((degree) => (
                <div
                  key={degree.id}
                  className={`p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${selectedDegree?.id === degree.id ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => handleDegreeSelect(degree)}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">{degree.name}</h4>
                    {selectedDegree?.id === degree.id && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                  {degree.description && (
                    <p className="text-sm text-muted-foreground mt-1">{degree.description}</p>
                  )}
                </div>
              ))}
            </div>
          ) : step === 'type' && selectedDegree ? (
            <div className="space-y-2 animate-fadeIn">
              <h3 className="text-sm font-medium mb-2">Select a Degree Type</h3>
              {Object.values(DegreeType).map((type) => (
                <div
                  key={type}
                  className={`p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${selectedType === type ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => handleTypeSelect(type)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      {getDegreeTypeIcon(type)}
                      <h4 className="font-medium">{getDegreeTypeDisplay(type)}</h4>
                    </div>
                    {selectedType === type && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center animate-fadeIn">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No programs found. Try a different search term." : "No data available."}
              </p>
            </div>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            disabled={!selectedDegree || !selectedType || isLoading} 
            onClick={handleAddProgram}
          >
            Add to Plan
          </Button>
        </div>
      </DialogContent>
      
      {/* CSS for animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
      `}</style>
    </Dialog>
  );
}