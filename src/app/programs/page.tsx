"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Mock data
const MOCK_PROGRAMS = [
  {
    id: "1",
    name: "Mathematical Physics",
    faculty: "Mathematics",
    description: "The Mathematical Physics plan provides an excellent preparation for graduate work in theoretical and mathematical physics, as well as certain areas of mathematics. Students who have both mathematical ability and a strong interest in the physical sciences find this an attractive and challenging program.",
    degrees: ["Bachelor of Mathematics"]
  },
  {
    id: "2",
    name: "Computer Science",
    faculty: "Mathematics",
    description: "The Computer Science program provides a foundation for understanding how computers work and how they can be used to solve real-world problems. Students gain skills in designing algorithms, programming languages, software engineering, systems, and computer architecture.",
    degrees: ["Bachelor of Computer Science", "Bachelor of Mathematics"]
  },
  {
    id: "3",
    name: "Pure Mathematics",
    faculty: "Mathematics",
    description: "The Pure Mathematics program focuses on the theoretical aspects of mathematics, including algebra, analysis, geometry, and topology. Students develop abstract reasoning skills and a deep understanding of mathematical structures.",
    degrees: ["Bachelor of Mathematics"]
  },
  {
    id: "4",
    name: "Applied Mathematics",
    faculty: "Mathematics",
    description: "The Applied Mathematics program emphasizes the application of mathematics to real-world problems in areas such as engineering, physics, biology, and economics. Students learn to develop and analyze mathematical models.",
    degrees: ["Bachelor of Mathematics"]
  },
  {
    id: "5",
    name: "Statistics",
    faculty: "Mathematics",
    description: "The Statistics program provides a strong foundation in statistical theory and methods, including data analysis, probability, and statistical inference. Students learn to design experiments, collect and analyze data, and draw meaningful conclusions.",
    degrees: ["Bachelor of Mathematics"]
  },
  {
    id: "6",
    name: "Mechanical Engineering",
    faculty: "Engineering",
    description: "The Mechanical Engineering program covers the design, analysis, and manufacturing of mechanical systems. Students gain skills in thermodynamics, fluid mechanics, solid mechanics, and control systems.",
    degrees: ["Bachelor of Applied Science"]
  },
  {
    id: "7",
    name: "Electrical Engineering",
    faculty: "Engineering",
    description: "The Electrical Engineering program focuses on the design and analysis of electrical and electronic systems. Students gain skills in circuits, electromagnetics, signal processing, power systems, and telecommunications.",
    degrees: ["Bachelor of Applied Science"]
  },
  {
    id: "8",
    name: "Biology",
    faculty: "Science",
    description: "The Biology program provides a comprehensive study of living organisms, from molecules to ecosystems. Students gain an understanding of the structure, function, and evolution of biological systems.",
    degrees: ["Bachelor of Science"]
  }
];

// Get unique faculties
const faculties = Array.from(
  new Set(MOCK_PROGRAMS.map((program) => program.faculty))
).sort();

export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFaculty, setFilterFaculty] = useState<string | null>(null);
  
  // Filter programs based on search term and faculty filter
  const filteredPrograms = MOCK_PROGRAMS.filter((program) => {
    const matchesSearch = 
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFaculty = !filterFaculty || program.faculty === filterFaculty;
    
    return matchesSearch && matchesFaculty;
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">UWaterloo Programs</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-3">
            <div className="relative">
              <Input
                placeholder="Search for programs by name (e.g. Computer Science, Biology)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-4 pr-10"
              />
            </div>
          </div>
          <div>
            <select 
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
              value={filterFaculty || ""}
              onChange={(e) => setFilterFaculty(e.target.value || null)}
            >
              <option value="">All Faculties</option>
              {faculties.map((faculty) => (
                <option key={faculty} value={faculty}>
                  {faculty}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {filteredPrograms.map((program) => (
            <Card key={program.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {program.name}
                    </CardTitle>
                    <div className="flex gap-2 mt-1">
                      <Badge className="bg-muted text-foreground hover:bg-muted">
                        {program.faculty}
                      </Badge>
                      {program.degrees.slice(0, 1).map((degree, index) => (
                        <Badge key={index} className="bg-primary hover:bg-primary/90">
                          {degree}
                        </Badge>
                      ))}
                      {program.degrees.length > 1 && (
                        <Badge className="bg-primary/80 hover:bg-primary/70">
                          +{program.degrees.length - 1} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Link href={`/programs/${program.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{program.description}</p>
              </CardContent>
            </Card>
          ))}
          
          {filteredPrograms.length === 0 && (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No programs found matching your criteria</p>
            </div>
          )}
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