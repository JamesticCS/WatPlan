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

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.id as string;
  
  // This would be fetched from the database in a real app
  const plan = {
    id: planId,
    name: "Bachelor of Mathematics - Mathematical Physics",
    created: "March 5, 2025",
    progress: 75,
    degrees: [
      {
        id: "1",
        name: "Mathematical Physics",
        type: "MAJOR",
        progress: 75,
      },
    ],
    courses: [
      { id: "1", code: "MATH", catalogNumber: "135", title: "Algebra for Honours Mathematics", status: "COMPLETED", term: "Fall 2023", grade: "90" },
      { id: "2", code: "MATH", catalogNumber: "137", title: "Calculus 1 for Honours Mathematics", status: "COMPLETED", term: "Fall 2023", grade: "92" },
      { id: "3", code: "CS", catalogNumber: "135", title: "Designing Functional Programs", status: "COMPLETED", term: "Fall 2023", grade: "88" },
      { id: "4", code: "PHYS", catalogNumber: "121", title: "Mechanics", status: "COMPLETED", term: "Fall 2023", grade: "85" },
      { id: "5", code: "MATH", catalogNumber: "136", title: "Linear Algebra 1 for Honours Mathematics", status: "COMPLETED", term: "Winter 2024", grade: "88" },
      { id: "6", code: "MATH", catalogNumber: "138", title: "Calculus 2 for Honours Mathematics", status: "COMPLETED", term: "Winter 2024", grade: "91" },
      { id: "7", code: "PHYS", catalogNumber: "122", title: "Waves, Electricity and Magnetism", status: "COMPLETED", term: "Winter 2024", grade: "87" },
      { id: "8", code: "MATH", catalogNumber: "235", title: "Linear Algebra 2 for Honours Mathematics", status: "IN_PROGRESS", term: "Fall 2024" },
      { id: "9", code: "MATH", catalogNumber: "237", title: "Calculus 3 for Honours Mathematics", status: "IN_PROGRESS", term: "Fall 2024" },
      { id: "10", code: "PHYS", catalogNumber: "234", title: "Quantum Physics 1", status: "PLANNED", term: "Winter 2025" },
    ],
    requirements: [
      { id: "1", name: "Required Math Courses", status: "IN_PROGRESS", progress: 80 },
      { id: "2", name: "Required Physics Courses", status: "IN_PROGRESS", progress: 60 },
      { id: "3", name: "Electives", status: "IN_PROGRESS", progress: 40 },
      { id: "4", name: "Additional AMATH/PHYS Courses", status: "NOT_STARTED", progress: 0 },
    ]
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{plan.name}</h1>
            <p className="text-muted-foreground">Created on {plan.created}</p>
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
                    <CardTitle>My Courses</CardTitle>
                    <Link href={`/plans/${planId}/add-course`}>
                      <Button size="sm">Add Course</Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <PlanCourseList courses={plan.courses} />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="requirements">
                <Card>
                  <CardHeader>
                    <CardTitle>Degree Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PlanRequirements requirements={plan.requirements} />
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
                      <span>{plan.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${plan.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-3">Programs</h3>
                    {plan.degrees.map((degree) => (
                      <div key={degree.id} className="mb-3">
                        <div className="flex justify-between mb-1 text-sm">
                          <span>{degree.name} ({degree.type})</span>
                          <span>{degree.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${degree.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Add Program
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-medium mb-2">Summary</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-2xl font-bold">10</div>
                        <div className="text-xs text-muted-foreground">Courses</div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-2xl font-bold">5.0</div>
                        <div className="text-xs text-muted-foreground">Units Completed</div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-2xl font-bold">88.5</div>
                        <div className="text-xs text-muted-foreground">Average Grade</div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="text-2xl font-bold">15.0</div>
                        <div className="text-xs text-muted-foreground">Units Required</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}