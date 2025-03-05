"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// Mock data
const MOCK_COURSES = [
  { id: "1", code: "MATH", catalogNumber: "135", title: "Algebra for Honours Mathematics", units: 0.5, description: "Introduction to the language of mathematics and proof techniques through a study of the basic algebraic systems of mathematics: the integers, the integers modulo n, the rational numbers, the real numbers, the complex numbers and polynomials." },
  { id: "2", code: "MATH", catalogNumber: "137", title: "Calculus 1 for Honours Mathematics", units: 0.5, description: "Limits, continuity, differentiation, applications of derivatives, definite integrals, fundamental theorem of calculus, techniques of integration, applications of integration, series (convergence tests, power series, Taylor's theorem)." },
  { id: "3", code: "CS", catalogNumber: "135", title: "Designing Functional Programs", units: 0.5, description: "An introduction to the fundamentals of computer science through the application of elementary programming patterns in the functional style of programming. The course will emphasize the design and analysis of software using abstraction techniques." },
  { id: "4", code: "PHYS", catalogNumber: "121", title: "Mechanics", units: 0.5, description: "Kinematics in one and two dimensions. Dynamics of a particle: Newton's second law; work, energy, power; conservative and non-conservative forces; momentum; collisions. Rotational kinematics and dynamics." },
  { id: "5", code: "MATH", catalogNumber: "136", title: "Linear Algebra 1 for Honours Mathematics", units: 0.5, description: "Systems of linear equations, matrices, determinants, vector spaces, linear transformations, bases, rank, eigenvalues, eigenvectors and diagonalization." },
  { id: "6", code: "MATH", catalogNumber: "138", title: "Calculus 2 for Honours Mathematics", units: 0.5, description: "Vectors, parametric curves, partial derivatives, grad, div, curl, multiple integrals, line integrals, surface integrals, the fundamental theorems of vector calculus." },
  { id: "7", code: "PHYS", catalogNumber: "122", title: "Waves, Electricity and Magnetism", units: 0.5, description: "Oscillatory motion, wave propagation, sound waves, superposition, standing waves. Electrostatics, electric fields, electric potential, capacitance. Electric current, resistance, DC circuits. Magnetic fields, electromagnetic induction, AC circuits. Electromagnetic waves, light, optics." },
  { id: "8", code: "MATH", catalogNumber: "235", title: "Linear Algebra 2 for Honours Mathematics", units: 0.5, description: "Orthogonal and unitary matrices and transformations. Orthogonal projections. Inner product spaces. Gram-Schmidt orthogonalization process. Least squares approximation. Change of basis and eigendecomposition for symmetric matrices. Singular value decomposition with applications." },
  { id: "9", code: "MATH", catalogNumber: "237", title: "Calculus 3 for Honours Mathematics", units: 0.5, description: "Sequences and series: convergence tests, power series, Taylor expansions. Differential calculus of functions of several variables: partial derivatives, the chain rule, the gradient. Extrema of functions of several variables. Multiple integration: double and triple integrals, applications, Jacobians, cylindrical and spherical coordinates." },
  { id: "10", code: "PHYS", catalogNumber: "234", title: "Quantum Physics 1", units: 0.5, description: "The experimental basis of quantum mechanics; wave-particle duality, the Schrödinger equation, application to simple one-dimensional problems, including the harmonic oscillator; operator methods; angular momentum, the hydrogen atom." },
];

export default function CoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState<string | null>(null);
  
  // Get unique subjects from courses
  const subjects = Array.from(
    new Set(MOCK_COURSES.map((course) => course.code))
  ).sort();
  
  // Filter courses based on search term and subject filter
  const filteredCourses = MOCK_COURSES.filter((course) => {
    const matchesSearch = 
      (course.code + " " + course.catalogNumber).toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !filterSubject || course.code === filterSubject;
    
    return matchesSearch && matchesSubject;
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 container py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Course Catalog</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="md:col-span-3">
            <div className="relative">
              <Input
                placeholder="Search for courses by code or title (e.g. MATH 135, Linear Algebra)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 pl-4 pr-10"
              />
            </div>
          </div>
          <div>
            <select 
              className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
              value={filterSubject || ""}
              onChange={(e) => setFilterSubject(e.target.value || null)}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {course.code} {course.catalogNumber}: {course.title}
                    </CardTitle>
                    <Badge className="mt-1 bg-muted text-foreground hover:bg-muted">
                      {course.units} units
                    </Badge>
                  </div>
                  <Link href={`/courses/${course.code}${course.catalogNumber}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{course.description}</p>
              </CardContent>
            </Card>
          ))}
          
          {filteredCourses.length === 0 && (
            <div className="text-center p-8">
              <p className="text-muted-foreground">No courses found matching your criteria</p>
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