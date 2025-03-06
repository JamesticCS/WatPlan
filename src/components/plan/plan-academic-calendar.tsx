import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AcademicCalendarYear } from "@/types";
import { updatePlan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Info } from "lucide-react";

interface PlanAcademicCalendarProps {
  planId: string;
  currentCalendarYear?: AcademicCalendarYear;
  onCalendarUpdated: () => void;
}

export function PlanAcademicCalendar({ planId, currentCalendarYear, onCalendarUpdated }: PlanAcademicCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicCalendarYear | undefined>(currentCalendarYear);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Reset selected year when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedYear(currentCalendarYear);
    }
  }, [isOpen, currentCalendarYear]);

  // Academic calendar year options
  const calendarYears: AcademicCalendarYear[] = [
    '2024-2025',
    '2023-2024',
    '2022-2023',
    '2021-2022',
    '2020-2021'
  ];

  // Handle selecting a calendar year
  const handleYearSelect = (year: AcademicCalendarYear) => {
    setSelectedYear(year);
  };

  // Handle saving the selected calendar year
  const handleSaveCalendarYear = async () => {
    if (!selectedYear) {
      toast({
        title: "Error",
        description: "Please select an academic calendar year",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    const response = await updatePlan(planId, {
      academicCalendarYear: selectedYear,
    });
    setIsLoading(false);
    
    if (response.error) {
      toast({
        title: "Error",
        description: `Failed to update academic calendar: ${response.error}`,
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Calendar updated",
      description: `Academic calendar set to ${selectedYear}`,
    });
    
    setIsOpen(false);
    onCalendarUpdated();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full" aria-label="Select Academic Calendar">
          <Calendar className="mr-2 h-4 w-4" />
          {currentCalendarYear ? `Calendar: ${currentCalendarYear}` : "Select Academic Calendar"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Academic Calendar</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4 bg-muted p-3 rounded-lg">
            <Info className="h-4 w-4" />
            <p>Select which academic calendar year your program(s) should follow. This determines which degree requirements apply to your plan.</p>
          </div>
          
          <div className="space-y-2">
            {calendarYears.map((year) => (
              <div
                key={year}
                className={`p-3 rounded-md border hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer ${selectedYear === year ? 'border-primary bg-primary/10' : ''}`}
                onClick={() => handleYearSelect(year)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <span className="font-medium">{year} Academic Year</span>
                  </div>
                  {selectedYear === year && (
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            disabled={!selectedYear || isLoading || selectedYear === currentCalendarYear} 
            onClick={handleSaveCalendarYear}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}