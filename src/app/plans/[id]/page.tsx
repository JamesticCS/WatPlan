"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PlanCourseList } from "@/components/plan/plan-course-list";
import { PlanRequirements } from "@/components/plan/plan-requirements";
import { PlanAddProgram } from "@/components/plan/plan-add-program";
import { PlanAcademicCalendar } from "@/components/plan/plan-academic-calendar";
import { CourseWithStatus, Plan, PlanCourse, Requirement } from "@/types";
import { useEffect, useState } from "react";
import { getPlan, removeDegreeFromPlan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { X, AlertTriangle } from "lucide-react";

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Load plan data from API
  useEffect(() => {
    const fetchPlan = async () => {
      setIsLoading(true);
      const response = await getPlan(planId);
      setIsLoading(false);
      
      if (response.error) {
        toast({
          title: "Error",
          description: `Failed to load plan: ${response.error}`,
          variant: "destructive",
        });
        return;
      }
      
      if (response.data) {
        setPlan(response.data.plan);
      }
    };
    
    fetchPlan();
  }, [planId, toast]);
  
  // Calculate progress
  const calculateProgress = () => {
    if (!plan || !plan.courses || plan.courses.length === 0) return 0;
    
    const completedCourses = plan.courses.filter(
      course => course.status === 'COMPLETED'
    ).length;
    
    return Math.round((completedCourses / plan.courses.length) * 100);
  };
  
  // Calculate units completed
  const calculateUnitsCompleted = () => {
    if (!plan || !plan.courses) return 0;
    
    return plan.courses
      .filter(pc => pc.status === 'COMPLETED')
      .reduce((total, pc) => total + (pc.course?.units || 0), 0);
  };
  
  // Format date string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate average grade
  const calculateAverageGrade = () => {
    if (!plan || !plan.courses) return 0;
    
    const coursesWithGrades = plan.courses.filter(pc => 
      pc.status === 'COMPLETED' && pc.grade && !isNaN(parseFloat(pc.grade))
    );
    
    if (coursesWithGrades.length === 0) return 0;
    
    const sum = coursesWithGrades.reduce((total, pc) => 
      total + parseFloat(pc.grade || "0"), 0
    );
    
    return (sum / coursesWithGrades.length).toFixed(1);
  };

  // Convert PlanCourse[] to CourseWithStatus[] for PlanCourseList component
  const adaptCoursesForList = (): CourseWithStatus[] => {
    if (!plan || !plan.courses) return [];
    
    return plan.courses.map(pc => ({
      id: pc.course.id,
      courseCode: pc.course.courseCode,
      catalogNumber: pc.course.catalogNumber,
      title: pc.course.title,
      description: pc.course.description,
      units: pc.course.units,
      prerequisites: pc.course.prerequisites,
      corequisites: pc.course.corequisites,
      antirequisites: pc.course.antirequisites,
      status: pc.status,
      term: pc.term || '',
      grade: pc.grade
    }));
  };
  
  // Mock requirements data until we have real implementation
  const mockRequirements: Requirement[] = [
    { 
      id: "1", 
      name: "Required Math Courses", 
      status: "IN_PROGRESS", 
      progress: 80,
      type: "COURSE_LIST",
      description: "",
    },
    { 
      id: "2", 
      name: "Required Physics Courses", 
      status: "IN_PROGRESS", 
      progress: 60,
      type: "COURSE_LIST",
      description: "",
    },
    { 
      id: "3", 
      name: "Electives", 
      status: "IN_PROGRESS", 
      progress: 40,
      type: "COURSE_LIST",
      description: "",
    },
    { 
      id: "4", 
      name: "Additional AMATH/PHYS Courses", 
      status: "NOT_STARTED", 
      progress: 0,
      type: "COURSE_LIST",
      description: "",
    },
  ];
  
  return (
    <div className="flex flex-col min-h-screen">
      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        
        @keyframes removeAnimation {
          0% {
            opacity: 1;
            transform: scale(1);
            max-height: 200px;
          }
          70% {
            opacity: 0;
            transform: scale(0.95);
            max-height: 200px;
          }
          100% {
            opacity: 0;
            transform: scale(0.9);
            max-height: 0;
            margin: 0;
            padding: 0;
            border-width: 0;
          }
        }
        
        .program-removing {
          animation: removeAnimation 0.4s ease-in-out forwards !important;
          overflow: hidden;
        }
      `}</style>
      <Navbar />
      <div className="container py-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <p className="text-muted-foreground">Loading plan...</p>
          </div>
        ) : !plan ? (
          <div className="flex flex-col items-center justify-center p-12">
            <h2 className="text-xl font-semibold mb-2">Plan not found</h2>
            <p className="text-muted-foreground mb-6">The plan you're looking for doesn't exist or you don't have access to it.</p>
            <Button variant="outline" onClick={() => router.push("/plans")}>
              Back to Plans
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">{plan.name}</h1>
                <p className="text-muted-foreground">Created on {formatDate(plan.created)}</p>
                {plan.degrees && plan.degrees.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {plan.degrees.map(deg => (
                      <span key={deg.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
                        {deg.type}: {deg.degree.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push("/plans")}>
                  Back to Plans
                </Button>
                <Button>
                  Edit Plan
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Tabs defaultValue="courses">
                  <TabsList className="mb-4">
                    <TabsTrigger value="courses">Courses</TabsTrigger>
                    <TabsTrigger value="requirements">Requirements</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="courses">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>My Academic Schedule</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PlanCourseList courses={adaptCoursesForList()} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="requirements">
                    <Card>
                      <CardHeader>
                        <CardTitle>Degree Requirements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PlanRequirements requirements={mockRequirements} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1 text-sm">
                          <span>Degree Completion</span>
                          <span>{calculateProgress()}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${calculateProgress()}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-medium mb-3">Academic Calendar</h3>
                        <PlanAcademicCalendar 
                          planId={planId} 
                          currentCalendarYear={plan.academicCalendarYear}
                          onCalendarUpdated={() => {
                            // Refresh plan data
                            const fetchPlan = async () => {
                              setIsLoading(true);
                              const response = await getPlan(planId);
                              setIsLoading(false);
                              
                              if (response.error) {
                                toast({
                                  title: "Error",
                                  description: `Failed to load plan: ${response.error}`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              if (response.data) {
                                setPlan(response.data.plan);
                              }
                            };
                            
                            fetchPlan();
                          }}
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                          Select which academic calendar year your program should follow. This determines which degree requirements apply to your plan.
                        </div>
                      </div>

                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-medium mb-3">Programs</h3>
                        {plan.degrees && plan.degrees.length > 0 ? (
                          <div className="space-y-3">
                            {plan.degrees.map((degree, index) => (
                              <div 
                                key={degree.id} 
                                className={`p-3 border rounded-md ${degree.isRemoving ? 'program-removing' : 'animate-fadeIn'}`}
                                style={{ animationDelay: `${index * 50}ms` }}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <div className="font-medium">
                                      {degree.degree.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                      <span className="capitalize">{degree.type.toLowerCase()}</span>
                                      {degree.degree.program?.faculty && (
                                        <>
                                          <span className="text-gray-400">•</span>
                                          <span>{degree.degree.program.faculty.name}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                                    onClick={async () => {
                                      // Ask for confirmation
                                      if (!confirm(`Are you sure you want to remove ${degree.degree.name} from your plan?`)) {
                                        return;
                                      }
                                      
                                      try {
                                        // Flag for animation
                                        setPlan(prev => {
                                          if (!prev) return null;
                                          return {
                                            ...prev,
                                            degrees: prev.degrees.map(d => 
                                              d.id === degree.id 
                                                ? { ...d, isRemoving: true } 
                                                : d
                                            )
                                          };
                                        });
                                        
                                        // Wait for animation to complete
                                        setTimeout(async () => {
                                          // Remove the program locally first for better UX
                                          setPlan(prev => {
                                            if (!prev) return null;
                                            return {
                                              ...prev,
                                              degrees: prev.degrees.filter(d => d.id !== degree.id)
                                            };
                                          });
                                          
                                          // Then call API
                                          const response = await removeDegreeFromPlan(planId, degree.id);
                                          
                                          if (response.error) {
                                            // If API call fails, add the program back
                                            setPlan(prev => {
                                              if (!prev) return null;
                                              const updatedDegrees = [...prev.degrees];
                                              if (!updatedDegrees.some(d => d.id === degree.id)) {
                                                updatedDegrees.push(degree);
                                              }
                                              return {
                                                ...prev,
                                                degrees: updatedDegrees
                                              };
                                            });
                                            
                                            throw new Error(response.error);
                                          }
                                          
                                          toast({
                                            title: "Program removed",
                                            description: `Removed ${degree.degree.name} from your plan`
                                          });
                                        }, 300);
                                      } catch (error) {
                                        toast({
                                          title: "Error",
                                          description: `Failed to remove program: ${error instanceof Error ? error.message : 'Unknown error'}`,
                                          variant: "destructive"
                                        });
                                      }
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                                  <div 
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${calculateProgress()}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="border rounded-md p-4 text-center animate-fadeIn">
                            <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                            <p className="text-sm font-medium mb-1">No programs added yet</p>
                            <p className="text-xs text-muted-foreground mb-3">
                              Add a program to track your degree requirements
                            </p>
                          </div>
                        )}
                        <PlanAddProgram 
                          planId={planId} 
                          onProgramAdded={() => {
                            // Refresh plan data
                            const fetchPlan = async () => {
                              setIsLoading(true);
                              const response = await getPlan(planId);
                              setIsLoading(false);
                              
                              if (response.error) {
                                toast({
                                  title: "Error",
                                  description: `Failed to load plan: ${response.error}`,
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              if (response.data) {
                                setPlan(response.data.plan);
                              }
                            };
                            
                            fetchPlan();
                          }} 
                        />
                      </div>
                      
                      <div className="border-t pt-4 mt-4">
                        <h3 className="text-sm font-medium mb-2">Summary</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="text-2xl font-bold">{plan.courses?.length || 0}</div>
                            <div className="text-xs text-muted-foreground">Courses</div>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="text-2xl font-bold">{calculateUnitsCompleted()}</div>
                            <div className="text-xs text-muted-foreground">Units Completed</div>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="text-2xl font-bold">{calculateAverageGrade()}</div>
                            <div className="text-xs text-muted-foreground">Average Grade</div>
                          </div>
                          <div className="bg-muted p-3 rounded-lg">
                            <div className="text-2xl font-bold">-</div>
                            <div className="text-xs text-muted-foreground">Units Required</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}