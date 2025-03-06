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

// Define program option interface that combines degree and type
interface ProgramOption {
  id: string;
  degreeId: string;
  degreeName: string;
  programName: string;
  facultyName?: string;
  type: DegreeType;
}

export function PlanAddProgram({ planId, onProgramAdded }: PlanAddProgramProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFaculty, setSelectedFaculty] = useState<string | null>(null);
  const [selectedProgramOption, setSelectedProgramOption] = useState<ProgramOption | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programOptions, setProgramOptions] = useState<ProgramOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'faculty' | 'program'>('faculty');
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
        
        // Create program options from loaded programs
        const options: ProgramOption[] = [];
        
        // For now, let's simulate having specific degree type combinations
        // In real implementation, these would come from the backend
        response.data.programs.forEach(program => {
          program.degrees.forEach(degree => {
            // Major is available for most programs
            options.push({
              id: `${degree.id}-MAJOR`,
              degreeId: degree.id,
              degreeName: degree.name,
              programName: program.name,
              facultyName: program.faculty?.name,
              type: DegreeType.MAJOR
            });
            
            // Only add minor for select programs (e.g. Math-related)
            if (program.name.includes('Math') || program.name.includes('Computer Science')) {
              options.push({
                id: `${degree.id}-MINOR`,
                degreeId: degree.id,
                degreeName: degree.name,
                programName: program.name,
                facultyName: program.faculty?.name,
                type: DegreeType.MINOR
              });
            }
            
            // Only add specialization for select programs
            if (program.name.includes('Science') || program.name.includes('Engineering')) {
              options.push({
                id: `${degree.id}-SPECIALIZATION`,
                degreeId: degree.id,
                degreeName: degree.name,
                programName: program.name,
                facultyName: program.faculty?.name,
                type: DegreeType.SPECIALIZATION
              });
            }
          });
        });
        
        setProgramOptions(options);
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
        setSelectedProgramOption(null);
        setStep('faculty');
      }, 300); // Add slight delay to prevent flickering during close animation
    }
  }, [isOpen]);
  
  // Handle faculty selection
  const handleFacultySelect = (facultyId: string) => {
    setSelectedFaculty(facultyId);
    setStep('program');
  };
  
  // Handle program option selection
  const handleProgramOptionSelect = (option: ProgramOption) => {
    setSelectedProgramOption(option);
  };
  
  // Handle adding the program to the plan
  const handleAddProgram = async () => {
    if (!selectedProgramOption) {
      toast({
        title: "Error",
        description: "Please select a program",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const response = await addDegreeToPlan(planId, {
      degreeId: selectedProgramOption.degreeId,
      type: selectedProgramOption.type,
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
      description: `Added ${selectedProgramOption.programName} (${getDegreeTypeDisplay(selectedProgramOption.type)}) to your plan`,
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
        <Button variant="outline" size="sm" className="w-full" aria-label="Add Program">
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
        
        {/* Selection breadcrumbs - fixed height container */}
        <div className="h-10 mb-4">
          {(selectedFaculty || selectedProgramOption) && (
            <div className="flex flex-wrap gap-2 transition-opacity duration-200">
              {selectedFaculty && faculties.find(f => f.id === selectedFaculty) && (
                <div className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                  <span>{faculties.find(f => f.id === selectedFaculty)?.name}</span>
                  <button 
                    className="ml-2 hover:bg-primary/20 rounded-full p-0.5"
                    onClick={() => {
                      setSelectedFaculty(null);
                      setSelectedProgramOption(null);
                      setStep('faculty');
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Content container with fixed height */}
        <div className="h-[400px] overflow-hidden">
          {/* Loading state */}
          <div className={`absolute inset-0 flex items-center justify-center bg-background z-10 transition-opacity duration-300 ${isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-rotate"></div>
              <p className="text-sm text-muted-foreground mt-2">Loading...</p>
            </div>
          </div>
          
          {/* Content based on current step - all rendered simultaneously but with opacity transitions */}
          <div className="h-full relative">
            {/* Search results */}
            <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-300 ${searchQuery && programOptions.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="space-y-2 pb-4">
                <h3 className="text-sm font-medium mb-2">Search Results</h3>
                {programOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${selectedProgramOption?.id === option.id ? 'border-primary bg-primary/10' : ''}`}
                    onClick={() => handleProgramOptionSelect(option)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          {getDegreeTypeIcon(option.type)}
                          <h4 className="font-medium">{option.programName}</h4>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {getDegreeTypeDisplay(option.type)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{option.facultyName}</p>
                      </div>
                      <div className="h-5 w-5 flex items-center justify-center">
                        {selectedProgramOption?.id === option.id && (
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Faculty selection */}
            <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-300 ${!searchQuery && step === 'faculty' && faculties.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="space-y-2 pb-4">
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
                        <div className="h-5 w-5 flex items-center justify-center">
                          {selectedFaculty === faculty.id && (
                            <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </div>
                      {faculty.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{faculty.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Program selection */}
            <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-300 ${!searchQuery && step === 'program' && programOptions.length > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="space-y-2 pb-4">
                <h3 className="text-sm font-medium mb-2">Select a Program</h3>
                {programOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${selectedProgramOption?.id === option.id ? 'border-primary bg-primary/10' : ''}`}
                    onClick={() => handleProgramOptionSelect(option)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          {getDegreeTypeIcon(option.type)}
                          <h4 className="font-medium">{option.programName}</h4>
                          <Badge variant="outline" className="text-xs">
                            {getDegreeTypeDisplay(option.type)}
                          </Badge>
                        </div>
                      </div>
                      <div className="h-5 w-5 flex items-center justify-center">
                        {selectedProgramOption?.id === option.id && (
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* No results */}
            <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${!isLoading && ((searchQuery && programOptions.length === 0) || (!searchQuery && (step === 'faculty' && faculties.length === 0 || step === 'program' && programOptions.length === 0))) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "No programs found. Try a different search term." : "No data available."}
              </p>
            </div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            disabled={!selectedProgramOption || isLoading} 
            onClick={handleAddProgram}
          >
            Add to Plan
          </Button>
        </div>
      </DialogContent>
      
      {/* CSS for animations - no longer needed with our new approach */}
    </Dialog>
  );
}