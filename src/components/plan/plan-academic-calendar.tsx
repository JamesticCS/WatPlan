import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
// string is just a string now
import { updatePlan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Info } from "lucide-react";

interface PlanAcademicCalendarProps {
  planId: string;
  currentCalendarYear?: string;
  onCalendarUpdated: () => void;
}

export function PlanAcademicCalendar({ planId, currentCalendarYear, onCalendarUpdated }: PlanAcademicCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string | undefined>(currentCalendarYear);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  // Reset selected year when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedYear(currentCalendarYear);
    }
  }, [isOpen, currentCalendarYear]);

  // Academic calendar year options
  // Only 2025-2026 has data in the database; others are shown but disabled
  const AVAILABLE_YEAR = '2025-2026';
  const calendarYears: string[] = [
    '2025-2026',
    '2024-2025',
    '2023-2024',
    '2022-2023',
    '2021-2022',
  ];

  // Handle selecting a calendar year
  const handleYearSelect = (year: string) => {
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
            {calendarYears.map((year) => {
              const isAvailable = year === AVAILABLE_YEAR;
              return (
                <div
                  key={year}
                  className={`p-3 rounded-md border transition-colors ${
                    !isAvailable
                      ? 'opacity-50 cursor-not-allowed bg-muted/30'
                      : selectedYear === year
                        ? 'border-primary bg-primary/10 cursor-pointer'
                        : 'hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                  }`}
                  onClick={() => isAvailable && handleYearSelect(year)}
                  title={!isAvailable ? 'Calendar data not yet available for this year' : undefined}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className={`h-4 w-4 mr-2 ${isAvailable ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-medium ${!isAvailable ? 'text-muted-foreground' : ''}`}>
                        {year} Academic Year
                      </span>
                    </div>
                    {selectedYear === year && isAvailable && (
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                    {!isAvailable && (
                      <span className="text-xs text-muted-foreground">Not available</span>
                    )}
                  </div>
                </div>
              );
            })}
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