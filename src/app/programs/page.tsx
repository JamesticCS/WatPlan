"use client";

import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getPrograms, getFaculties } from "@/lib/api";
import { Program, Faculty } from "@/types";
import { useToast } from "@/hooks/use-toast";


export default function ProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFaculty, setFilterFaculty] = useState<string | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [facultiesList, setFacultiesList] = useState<Faculty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Fetch programs and faculties on initial load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Fetch faculties first
      const facultiesResponse = await getFaculties();
      if (facultiesResponse.error) {
        toast({
          title: "Error",
          description: `Failed to load faculties: ${facultiesResponse.error}`,
          variant: "destructive",
        });
      } else if (facultiesResponse.data) {
        setFacultiesList(facultiesResponse.data.faculties);
      }
      
      // Then fetch programs
      const programsResponse = await getPrograms();
      setIsLoading(false);
      
      if (programsResponse.error) {
        toast({
          title: "Error",
          description: `Failed to load programs: ${programsResponse.error}`,
          variant: "destructive",
        });
        return;
      }
      
      if (programsResponse.data) {
        setPrograms(programsResponse.data.programs);
      }
    };
    
    fetchData();
  }, [toast]);
  
  // Filter programs based on search term and faculty filter
  const filteredPrograms = programs.filter((program) => {
    const matchesSearch = 
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFaculty = !filterFaculty || program.faculty?.id === filterFaculty;
    
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
              disabled={isLoading}
            >
              <option value="">All Faculties</option>
              {facultiesList.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <div className="text-center p-8">
              <p className="text-muted-foreground">Loading programs...</p>
            </div>
          ) : (
            <>
              {filteredPrograms.map((program) => (
                <Card key={program.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {program.name}
                        </CardTitle>
                        <div className="flex gap-2 mt-1">
                          {program.faculty && (
                            <Badge className="bg-muted text-foreground hover:bg-muted">
                              {program.faculty.name}
                            </Badge>
                          )}
                          {program.degrees && program.degrees.slice(0, 1).map((degree) => (
                            <Badge key={degree.id} className="bg-primary hover:bg-primary/90">
                              {degree.name}
                            </Badge>
                          ))}
                          {program.degrees && program.degrees.length > 1 && (
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
                    <p className="text-sm text-muted-foreground">{program.description || "No description available."}</p>
                  </CardContent>
                </Card>
              ))}
              
              {filteredPrograms.length === 0 && !isLoading && (
                <div className="text-center p-8">
                  <p className="text-muted-foreground">No programs found matching your criteria</p>
                </div>
              )}
            </>
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