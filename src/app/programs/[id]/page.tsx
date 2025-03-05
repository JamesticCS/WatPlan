"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// Mock data for the program detail page
const PROGRAM_DETAIL = {
  id: "1",
  name: "Mathematical Physics",
  faculty: "Mathematics",
  description: "The Mathematical Physics plan provides an excellent preparation for graduate work in theoretical and mathematical physics, as well as certain areas of mathematics. Students who have both mathematical ability and a strong interest in the physical sciences find this an attractive and challenging program.",
  degrees: [
    {
      id: "bmh-mathphys",
      name: "Bachelor of Mathematics (Honours)",
      requirements: [
        {
          id: "req1",
          name: "Required Mathematics Courses",
          courses: [
            { code: "MATH", catalogNumber: "135", title: "Algebra for Honours Mathematics" },
            { code: "MATH", catalogNumber: "136", title: "Linear Algebra 1 for Honours Mathematics" },
            { code: "MATH", catalogNumber: "137", title: "Calculus 1 for Honours Mathematics" },
            { code: "MATH", catalogNumber: "138", title: "Calculus 2 for Honours Mathematics" },
            { code: "MATH", catalogNumber: "235", title: "Linear Algebra 2 for Honours Mathematics" },
            { code: "MATH", catalogNumber: "237", title: "Calculus 3 for Honours Mathematics" },
            { code: "MATH", catalogNumber: "239", title: "Introduction to Combinatorics" },
            { code: "MATH", catalogNumber: "245", title: "Linear Algebra 3 (Advanced Level)" },
            { code: "MATH", catalogNumber: "247", title: "Calculus 3 (Advanced Level)" },
            { code: "MATH", catalogNumber: "249", title: "Introduction to Combinatorics (Advanced Level)" },
          ]
        },
        {
          id: "req2",
          name: "Required Physics Courses",
          courses: [
            { code: "PHYS", catalogNumber: "121", title: "Mechanics" },
            { code: "PHYS", catalogNumber: "122", title: "Waves, Electricity and Magnetism" },
            { code: "PHYS", catalogNumber: "234", title: "Quantum Physics 1" },
            { code: "PHYS", catalogNumber: "242", title: "Electricity and Magnetism 1" },
            { code: "PHYS", catalogNumber: "263", title: "Classical Mechanics and Special Relativity" },
            { code: "PHYS", catalogNumber: "342", title: "Electricity and Magnetism 2" },
            { code: "PHYS", catalogNumber: "365", title: "Quantum Mechanics I" },
          ]
        },
        {
          id: "req3",
          name: "Additional Requirements",
          description: "Complete 3.5 units of additional AMATH or PHYS courses, with a minimum of 1.0 unit at the 300- or 400-level."
        },
        {
          id: "req4",
          name: "Additional Math Requirements",
          description: "Complete 1.0 unit of additional MATH courses at the 300-level or above."
        },
        {
          id: "req5",
          name: "Communication Requirements",
          courses: [
            { code: "ENGL", catalogNumber: "192", title: "Communication in Mathematics and Computer Science" },
          ]
        },
        {
          id: "req6",
          name: "Electives",
          description: "Additional courses to reach the 20.0 units required for the degree."
        }
      ]
    }
  ],
  relatedPrograms: [
    { id: "3", name: "Pure Mathematics" },
    { id: "4", name: "Applied Mathematics" },
    { id: "5", name: "Physics" },
  ]
};

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  
  // In a real app, you'd fetch the program details based on the ID
  const program = PROGRAM_DETAIL;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">{program.name}</h1>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-muted text-foreground hover:bg-muted">
                {program.faculty}
              </Badge>
              {program.degrees.map((degree) => (
                <Badge key={degree.id} className="bg-primary hover:bg-primary/90">
                  {degree.name}
                </Badge>
              ))}
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/programs")}>
            Back to Programs
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Program Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{program.description}</p>
              </CardContent>
            </Card>
            
            <Tabs defaultValue="requirements">
              <TabsList className="mb-4">
                <TabsTrigger value="requirements">Degree Requirements</TabsTrigger>
                <TabsTrigger value="courses">Required Courses</TabsTrigger>
              </TabsList>
              
              <TabsContent value="requirements">
                {program.degrees.map((degree) => (
                  <div key={degree.id} className="space-y-4">
                    <h2 className="text-xl font-bold">{degree.name} Requirements</h2>
                    {degree.requirements.map((reqGroup) => (
                      <Card key={reqGroup.id} className="mb-4">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{reqGroup.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {reqGroup.description && (
                            <p className="text-sm text-muted-foreground mb-4">{reqGroup.description}</p>
                          )}
                          {reqGroup.courses && (
                            <ul className="list-disc list-inside space-y-1">
                              {reqGroup.courses.map((course, idx) => (
                                <li key={idx} className="text-sm">
                                  <span className="font-medium">{course.code} {course.catalogNumber}</span>: {course.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </TabsContent>
              
              <TabsContent value="courses">
                <div className="space-y-4">
                  {program.degrees.map((degree) => (
                    <div key={degree.id} className="space-y-4">
                      <h2 className="text-xl font-bold">{degree.name} Courses</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {degree.requirements
                          .filter(req => req.courses)
                          .flatMap(req => req.courses || [])
                          .map((course, idx) => (
                            <Card key={idx}>
                              <CardHeader className="pb-2">
                                <CardTitle className="text-lg">{course.code} {course.catalogNumber}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground">{course.title}</p>
                                <div className="mt-4">
                                  <Link href={`/courses/${course.code}${course.catalogNumber}`}>
                                    <Button variant="outline" size="sm">View Course</Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Add to Your Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Add this program to your degree plan to track your progress.
                </p>
                <Button className="w-full">Add to My Plan</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Related Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {program.relatedPrograms.map((related) => (
                    <Link 
                      key={related.id}
                      href={`/programs/${related.id}`}
                      className="block p-3 border rounded-md hover:bg-muted transition-colors"
                    >
                      {related.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <footer className="py-6 border-t">
        <div className="container flex flex-col sm:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} WatPlan
          </p>
        </div>
      </footer>
    </div>
  );
}