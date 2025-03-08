"use client";

import React, { useState } from 'react';
import pdfToText from 'react-pdftotext';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload as UploadIcon, FileText as FileIcon, AlertCircle as AlertCircleIcon, CheckCircle as CheckCircleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlanTranscriptUploadProps {
  planId: string;
  onCoursesAdded: () => void;
}

interface ParsedCourse {
  code: string;
  description: string;
  earned: string;
  grade: string;
  term?: string;
  isTransfer?: boolean;
}

export function PlanTranscriptUpload({ planId, onCoursesAdded }: PlanTranscriptUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
  const [processedCourses, setProcessedCourses] = useState<{successful: string[], failed: string[]}>({
    successful: [],
    failed: []
  });
  const { toast } = useToast();

  const extractText = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    setIsProcessing(true);
    setErrorMessage(null);
    setParsedCourses([]);
    setProcessedCourses({
      successful: [],
      failed: []
    });
    
    console.log("Starting PDF extraction for file:", file.name);
    
    // Check if it's a Waterloo transcript based on filename pattern
    const isLikelyWaterlooTranscript = 
      file.name.toLowerCase().includes('transcript') || 
      file.name.toLowerCase().includes('ssr_tsrpt') ||
      file.name.toLowerCase().includes('waterloo');
    
    if (!isLikelyWaterlooTranscript) {
      console.log("Note: Filename doesn't look like a standard Waterloo transcript, but proceeding anyway");
    }
    
    pdfToText(file)
      .then(text => {
        // Log extracted text length for debugging
        console.log(`PDF extracted ${text.length} characters of text`);
        console.log("PDF extracted text sample:", text.substring(0, 200) + "..."); 
        
        if (text.length < 100) {
          setErrorMessage("The extracted text is too short. The PDF may be scanned or have content restrictions.");
          setIsProcessing(false);
          return;
        }
        
        // Check if this looks like a Waterloo transcript
        const isWaterlooTranscript = 
          text.includes("University of Waterloo") && 
          (text.includes("Undergraduate") || text.includes("Graduate") || text.includes("Transcript"));
        
        if (!isWaterlooTranscript) {
          console.warn("Warning: This doesn't appear to be a standard Waterloo transcript");
          // We'll still try to parse it, but show a warning
        }
        
        // Preprocess text to better handle common PDF extraction issues
        const preprocessedText = preprocessTranscriptText(text);
        
        // Parse the transcript
        const courses = parseTranscript(preprocessedText);
        
        if (courses.length === 0) {
          console.error("No courses could be parsed from transcript");
          setErrorMessage("Could not parse any courses from the transcript. Please ensure it's a Waterloo transcript.");
          setIsProcessing(false);
        } else {
          console.log(`Successfully parsed ${courses.length} courses from transcript`);
          setParsedCourses(courses);
          
          // Group courses by term to add them properly
          const coursesByTerm = groupCoursesByTerm(courses);
          addCoursesToPlan(coursesByTerm);
        }
      })
      .catch(error => {
        console.error("PDF processing error:", error);
        setErrorMessage("Failed to extract text from PDF. Ensure it is not password protected.");
        setIsProcessing(false);
      });
  };
  
  // Helper function to preprocess transcript text to handle common extraction issues
  const preprocessTranscriptText = (text: string): string => {
    // Fix common PDF extraction issues with line breaks and spaces
    
    // Log original text length and sample
    console.log(`Original transcript length: ${text.length} characters`);
    console.log("Original text sample:", text.substring(0, 200) + "...");
    
    // 1. Normalize excessive spaces and newlines
    let processed = text.replace(/\s+/g, ' ');
    
    // 2. Put line breaks back for key transcript sections with better patterns
    processed = processed.replace(/(Spring|Fall|Winter)\s+(\d{4})\s+Term/gi, '\n$1 $2 Term\n');
    processed = processed.replace(/(Spring|Fall|Winter)\s+(\d{4})\s+-\s+([1-4][AB])/gi, '\n$1 $2 - $3\n');
    processed = processed.replace(/(Spring|Fall|Winter)\s+(\d{4})/gi, '\n$1 $2\n');
    
    // 3. Break up course code patterns to ensure they're on their own lines
    // First, ensure proper space between course code and number 
    processed = processed.replace(/([A-Z]{2,})(\d{3}[A-Z]?)/g, '$1 $2');
    // Then add line breaks before course codes
    processed = processed.replace(/([A-Z]{2,})\s+(\d{3}[A-Z]?)/g, '\n$1 $2');
    
    // 4. Add line breaks for term markers (more comprehensive patterns)
    processed = processed.replace(/Level:\s*([1-4][AB])/gi, '\nLevel: $1\n');
    processed = processed.replace(/Term\s*([1-4][AB])/gi, '\nTerm $1\n');
    processed = processed.replace(/([1-4][AB])\s+Term/gi, '\n$1 Term\n');
    processed = processed.replace(/(Term)\s+(\d+)/gi, '\n$1 $2\n');
    
    // 5. For Waterloo transcripts, identify key sections with additional patterns
    const keyHeaders = [
      'Academic Standing', 'Faculty', 'Level', 'Program', 'Degree', 'Major', 'Plan',
      'Courses Completed', 'Academic Record', 'Course Details', 'Transcript', 'GPA',
      'Class Average', 'Term Average', 'Cumulative Average', 'Credits Earned',
      'Transfer Credits', 'Advanced Standing'
    ];
    
    keyHeaders.forEach(header => {
      const pattern = new RegExp(`(${header})`, 'gi');
      processed = processed.replace(pattern, '\n$1\n');
    });
    
    // 6. Restore line breaks around grade sections with improved patterns
    processed = processed.replace(/(Grade|Mark):\s*([A-Z][+-]?|\d{1,3})/gi, '\nGrade: $2\n');
    processed = processed.replace(/(\b(?:Earned|Final)\s+(?:Grade|Mark)\b):\s*([A-Z][+-]?|\d{1,3})/gi, '\n$1: $2\n');
    processed = processed.replace(/\b((?:Earned|Course)\s+Units):\s*(\d+\.\d+)/gi, '\n$1: $2\n');
    
    // 7. Handle course units and credits sections carefully
    processed = processed.replace(/(\d\.\d+)\s+unit/gi, '\n$1 unit');
    processed = processed.replace(/(\d\.\d+)\s+credit/gi, '\n$1 credit');
    
    // 8. Add breaks for course sections with grades - common Waterloo format
    // This separates the unit value from the grade to prevent confusion
    processed = processed.replace(/(\d\.\d+)\s+(\d\.\d+)\s+(\d{1,3}|\w+)/g, '$1 $2\n$3');
    
    // 9. Handle transfer credit sections with more clarity
    processed = processed.replace(/(Transfer Credit|Advanced Standing|Course Equivalency|Prior Education)/gi, '\n\n$1\n');
    
    // 10. Ensure multiple newlines are normalized to double newlines for section separation
    processed = processed.replace(/\n+/g, '\n\n').trim();
    
    // 11. Add extra markers around term sections for better identification
    processed = processed.replace(/(\n\n[1-4][AB]\s+Term|\n\nTerm\s+[1-4][AB]|\n\nLevel:\s*[1-4][AB])/gi, 
                                 '\n\n==== TERM SECTION ====\n$1');
    
    // 12. Better identify transfer credits with special markers
    processed = processed.replace(/(\n\nTransfer Credit|\n\nAdvanced Standing|\n\nPrior Education)/gi, 
                                 '\n\n==== TRANSFER SECTION ====\n$1');
    
    // Log sample of processed text and stats
    console.log(`Processed transcript length: ${processed.length} characters`);
    console.log("Processed text sample:", processed.substring(0, 200) + "...");
    
    return processed;
  };

  const parseTranscript = (text: string) => {
    // First, let's split by lines to better process the transcript
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    console.log("Parsing transcript, total lines:", lines.length);
    
    // Log some sample lines to help debug the parsing
    console.log("Sample transcript lines:", lines.slice(0, 10));
    
    // For a Waterloo transcript, we need a better regex to detect course codes and terms
    // Clean the text for overall processing
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    
    const courses: ParsedCourse[] = [];
    let currentTerm = "";
    
    // First pass: detect academic terms from the transcript
    // Look for patterns like "Spring 2024 - 2B" or "Fall 2022 Term 1A"
    const termRegex = /(Spring|Fall|Winter)\s+(\d{4})(?:\s+-\s+|\s+Term\s+)([1-4][AB])/gi;
    let termMatch;
    
    // Collect all term matches first
    const termMatches = [...cleanedText.matchAll(termRegex)];
    console.log("Found terms:", termMatches.map(m => `${m[1]} ${m[2]} - ${m[3]}`));
    
    // If we found structured term information, use it for section-based parsing
    if (termMatches.length > 0) {
      // Find the start points of each term section in the text
      const termSections = termMatches.map((match, index) => {
        const nextMatch = termMatches[index + 1];
        const startIndex = match.index || 0;
        const endIndex = nextMatch ? nextMatch.index : cleanedText.length;
        
        return {
          term: match[3], // e.g., "1A"
          section: cleanedText.substring(startIndex, endIndex)
        };
      });
      
      // Process each term section
      termSections.forEach(section => {
        console.log(`Processing section for term ${section.term}`);
        
        // Look for course codes in this section
        const coursesInSection = extractCoursesFromText(section.section);
        
        // Assign the current term to each course
        coursesInSection.forEach(course => {
          courses.push({
            ...course,
            term: section.term
          });
          console.log(`Found course in section ${section.term}: ${course.code} - ${course.grade}`);
        });
      });
    } else {
      // Fallback: if we can't detect term sections, try to extract courses without terms
      console.log("No term sections found, using fallback extraction");
      const extractedCourses = extractCoursesFromText(cleanedText);
      courses.push(...extractedCourses);
      
      // If no terms found in transcript, try to infer terms from line structure
      inferTermsFromCourseOrder(lines, courses);
    }
    
    console.log(`Parsed ${courses.length} courses from transcript`);
    return courses;
  };
  
  // Helper function to extract courses from text
  const extractCoursesFromText = (text: string): ParsedCourse[] => {
    const courses: ParsedCourse[] = [];
    
    // Enhanced pattern to match Waterloo course codes with space
    // This looks for things like "CS 135", "MATH 137", etc.
    const coursePattern = /([A-Z]{2,})\s+(\d{3}[A-Z]?)/g;
    const coursesFound = [...text.matchAll(coursePattern)];
    
    coursesFound.forEach(match => {
      const courseCode = match[1];
      const catalogNumber = match[2];
      const fullCode = `${courseCode} ${catalogNumber}`;
      
      // Find information near the course code (search a reasonable context)
      const startPos = match.index || 0;
      const searchArea = text.substring(startPos, Math.min(startPos + 300, text.length));
      
      // Detect if this is a transfer course by looking for specific keywords near the course
      const isTransferCourse = 
        searchArea.toLowerCase().includes("transfer") || 
        searchArea.toLowerCase().includes("advanced standing") || 
        searchArea.toLowerCase().includes("equiv") ||
        searchArea.toLowerCase().includes("prior education");
      
      // Look for grade patterns with better matching that won't mistake the units for a grade
      // Common patterns in Waterloo transcripts:
      // 1. Letter grades: A+, A, A-, B+, etc.
      // 2. Numeric grades: 95, 87, 76, etc.
      // 3. Special grades: CR (Credit), NCR (No Credit), etc.
      
      // Extract letter grade - look for letter grades with optional +/- or numeric grades
      // Use word boundaries to ensure we get clean matches
      const letterGradePattern = /\b([A-Z][+-]?|CR|DNW|INC)\b/;
      const letterGradeMatch = searchArea.match(letterGradePattern);
      const letterGrade = letterGradeMatch ? letterGradeMatch[1] : "";
      
      // Look for numeric grades, paying attention to common patterns in transcripts
      // We'll use a more specific pattern that appears after course info
      // Try to find numeric grade next to percentage or grade indicator
      const gradeIndicators = [
        /Grade:\s*(\d{1,3})/i,                  // "Grade: 95"
        /Mark:\s*(\d{1,3})/i,                   // "Mark: 95"
        /(\d{1,3})%/,                           // "95%"
        /\b(?:grade|mark|achieved)[\s:][\s\w]*?(\d{1,3})\b/i // Various formats
      ];
      
      let numericGrade = "";
      for (const pattern of gradeIndicators) {
        const match = searchArea.match(pattern);
        if (match) {
          numericGrade = match[1];
          break;
        }
      }
      
      // If no specific grade format found, look for standalone grades
      // but avoid mistaking the course units (0.50, 0.25, etc.) for grades
      if (!numericGrade && !letterGrade) {
        // First, check if there are units listed (to avoid confusing them with grades)
        const unitsMatch = searchArea.match(/(\d+\.\d+)\s*(?:unit|credit)s?/i);
        const units = unitsMatch ? unitsMatch[1] : null;
        
        // Now look for numeric grades that are NOT the units value
        const numericGradePattern = /\b((?:100|\d{2})(?:\.\d+)?)\b/g; // Only accept scores 10+
        const numericGrades = [...searchArea.matchAll(numericGradePattern)];
        
        for (const gradeMatch of numericGrades) {
          const potentialGrade = gradeMatch[1];
          // Make sure it's not the course units and it looks like a valid grade
          if ((!units || potentialGrade !== units) && 
              parseFloat(potentialGrade) > 0 && 
              parseFloat(potentialGrade) <= 100) {
            numericGrade = potentialGrade;
            break;
          }
        }
      }
      
      // Determine final grade to use, preferring numeric when available
      // For transfer credits, often there's no grade so use "CR" (Credit)
      const grade = isTransferCourse && !numericGrade && !letterGrade ? "CR" : 
                    numericGrade || letterGrade || "";
      
      // Extract earned units (usually 0.50, 0.25, etc.) - common in Waterloo transcripts
      const unitsPattern = /(\d+\.\d+)\s*(?:unit|credit)s?/i;
      const unitsMatch = searchArea.match(unitsPattern);
      const earned = unitsMatch ? unitsMatch[1] : "0.5"; // Default to 0.5 units
      
      // Extract course title - this is more challenging without specific formatting
      // Look for text between the course code and the next recognizable pattern
      const titlePattern = new RegExp(`${courseCode}\\s+${catalogNumber}\\s+(.*?)(?=\\b(?:\\d+\\.\\d+|[A-Z][+-]?|\\d{2})\\b|$)`, 'i');
      const titleMatch = searchArea.match(titlePattern);
      const description = titleMatch && titleMatch[1] ? titleMatch[1].trim() : "From transcript";
      
      console.log(`Found course: ${fullCode} - ${grade} ${isTransferCourse ? '(Transfer)' : ''}`);
      
      courses.push({
        code: fullCode,
        description,
        earned,
        grade,
        term: isTransferCourse ? "Unscheduled" : "", // Mark transfer courses as unscheduled
        isTransfer: isTransferCourse
      });
    });
    
    return courses;
  };
  
  // Helper function to try inferring terms from course order if no explicit term sections
  const inferTermsFromCourseOrder = (lines: string[], courses: ParsedCourse[]) => {
    // First, handle transfer courses - they should already be marked
    courses.forEach(course => {
      if (course.isTransfer) {
        course.term = "Unscheduled";
        console.log(`Marked transfer course ${course.code} as Unscheduled`);
      }
    });
    
    // Search entire transcript text for term patterns
    // Common Waterloo transcript formats include term markers like:
    // - "Fall 2022 - 1A"
    // - "Level: 2B"
    // - "Winter 2024 Term 3B"
    const termPatterns = [
      // Waterloo term patterns with more specific matching to improve accuracy
      { pattern: /Level:\s*([1-4][AB])/i, group: 1 },
      { pattern: /Term\s*([1-4][AB])/i, group: 1 },
      { pattern: /([1-4][AB])\s+Term/i, group: 1 },
      { pattern: /(Spring|Fall|Winter)\s+(\d{4})(?:\s+-\s+|\s+Term\s+|\s*)([1-4][AB])/i, group: 3 },
      // Additional patterns that might appear in transcripts
      { pattern: /Term\s+information[\s\S]*?([1-4][AB])/i, group: 1 },
      { pattern: /([1-4][AB])[\s\S]{0,50}(Spring|Fall|Winter)\s+(\d{4})/i, group: 1 }
    ];
    
    // Detect term sections in the text by looking at contextual clues in lines
    const termSections = [];
    let currentTerm = null;
    let inCoursesSection = false;
    
    // First pass: find and mark term section boundaries in the original lines
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect if we've entered the courses section of the transcript
      if (line.match(/Course\s+Descriptions|Courses\s+Completed|Course\s+Details|Academic\s+Record/i)) {
        inCoursesSection = true;
        continue;
      }
      
      // Only process term patterns if we're in the courses section
      if (!inCoursesSection) continue;
      
      // Check term end markers (like "Term Average" or "Term GPA")
      // This helps us define clearer boundaries between terms
      if (currentTerm && line.match(/Term\s+Average|Term\s+GPA|End\s+of\s+Term/i)) {
        // Mark the end of the current term section
        const lastSection = termSections[termSections.length - 1];
        if (lastSection && !lastSection.endLine) {
          lastSection.endLine = i;
        }
        continue;
      }
      
      // Check for term indicators
      let termFound = false;
      for (const { pattern, group } of termPatterns) {
        const match = line.match(pattern);
        if (match) {
          const term = match[group]; // Get the term identifier from the specified group
          console.log(`Found term header at line ${i}: ${term}`);
          
          // Only create a new term section if it's different from the current one
          if (currentTerm !== term) {
            // If we were tracking a term section, mark its end
            if (currentTerm && termSections.length > 0) {
              const lastSection = termSections[termSections.length - 1];
              if (!lastSection.endLine) {
                lastSection.endLine = i - 1;
              }
            }
            
            // Start a new term section
            termSections.push({
              term,
              startLine: i,
              endLine: null
            });
            currentTerm = term;
          }
          
          termFound = true;
          break;
        }
      }
      
      // If we encounter course codes after finding a term, associate them with this term
      if (currentTerm && !termFound) {
        const courseCodeMatch = line.match(/([A-Z]{2,})\s+(\d{3}[A-Z]?)/);
        if (courseCodeMatch) {
          // This line contains a course code, so it belongs to the current term
          const courseCode = courseCodeMatch[0];
          console.log(`Found course ${courseCode} in term ${currentTerm}, line ${i}`);
        }
      }
    }
    
    // Close the last term section if it's still open
    if (termSections.length > 0 && !termSections[termSections.length - 1].endLine) {
      termSections[termSections.length - 1].endLine = lines.length - 1;
    }
    
    // Sort term sections by the expected order of terms
    const termOrder = {"1A": 0, "1B": 1, "2A": 2, "2B": 3, "3A": 4, "3B": 5, "4A": 6, "4B": 7};
    termSections.sort((a, b) => {
      // If both terms are in the standard order, sort by that
      if (termOrder[a.term] !== undefined && termOrder[b.term] !== undefined) {
        return termOrder[a.term] - termOrder[b.term];
      }
      // Otherwise sort by the line number
      return a.startLine - b.startLine;
    });
    
    console.log(`Found ${termSections.length} term sections: ${termSections.map(t => t.term).join(', ')}`);
    
    // Second pass: extract courses within each term section and assign terms accordingly
    if (termSections.length > 0) {
      // Group lines by the term sections to make it easier to extract courses
      const termsWithContent = termSections.map(section => {
        // Get all lines for this term section
        const termLines = lines.slice(section.startLine, section.endLine + 1).join(' ');
        return {
          term: section.term,
          content: termLines
        };
      });
      
      // Create a map of course code to course object for quick lookup
      const courseMap = new Map();
      courses.forEach(course => {
        if (!course.isTransfer) { // Skip transfer courses
          courseMap.set(course.code, course);
        }
      });
      
      // Function to extract course codes from text
      const extractCourseCodes = (text) => {
        const coursePattern = /([A-Z]{2,})\s+(\d{3}[A-Z]?)/g;
        const coursesFound = [...text.matchAll(coursePattern)];
        return coursesFound.map(match => `${match[1]} ${match[2]}`);
      };
      
      // Process each term section and assign courses
      termsWithContent.forEach(({ term, content }) => {
        const courseCodes = extractCourseCodes(content);
        console.log(`Found ${courseCodes.length} potential courses in term ${term}`);
        
        // Assign term to each course found in this section
        courseCodes.forEach(code => {
          const course = courseMap.get(code);
          if (course && (!course.term || course.term === '')) {
            course.term = term;
            console.log(`Assigned term ${term} to course ${code} from section content`);
          }
        });
      });
      
      // Check for any unassigned non-transfer courses after processing term sections
      const stillUnassigned = courses.filter(c => !c.isTransfer && (!c.term || c.term === ''));
      
      if (stillUnassigned.length > 0) {
        console.log(`${stillUnassigned.length} courses still unassigned after term section processing`);
        
        // Assign remaining courses to terms based on order in transcript
        // This handles courses that might have been missed due to formatting issues
        let currentTermIndex = 0;
        stillUnassigned.forEach(course => {
          // Ensure we don't go out of bounds
          if (currentTermIndex >= termSections.length) {
            currentTermIndex = termSections.length - 1;
          }
          
          course.term = termSections[currentTermIndex].term;
          console.log(`Assigned term ${course.term} to course ${course.code} based on sequence`);
          
          // Move to next term after 4-5 courses (typical load per term)
          if (courses.filter(c => c.term === termSections[currentTermIndex].term).length >= 5) {
            currentTermIndex = Math.min(currentTermIndex + 1, termSections.length - 1);
          }
        });
      }
    } else {
      // If no term sections found, use a smarter assignment algorithm
      // First, look for common term sequences in the transcript text
      const fullText = lines.join(' ');
      const termSequenceMatch = fullText.match(/(?:Spring|Fall|Winter)\s+\d{4}.*?(?:Spring|Fall|Winter)\s+\d{4}/i);
      
      if (termSequenceMatch) {
        console.log("Found term sequence pattern but no explicit term labels");
        // Try to infer term structure from academic calendar references
        
        // Non-transfer courses in transcript order
        const unassignedCourses = courses.filter(c => !c.isTransfer && (!c.term || c.term === ""));
        
        if (unassignedCourses.length > 0) {
          console.log(`${unassignedCourses.length} courses need term assignment`);
          
          // Typical Waterloo course structure: 4-5 courses per term
          const coursesPerTerm = 5;
          const standardTerms = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"];
          
          unassignedCourses.forEach((course, index) => {
            const termIndex = Math.min(Math.floor(index / coursesPerTerm), standardTerms.length - 1);
            course.term = standardTerms[termIndex];
            console.log(`Assigned default term ${course.term} to course ${course.code}`);
          });
        }
      } else {
        // If truly no structure found, place all in Unscheduled
        console.log("No term structure detected in transcript, marking all as Unscheduled");
        courses.forEach(course => {
          if (!course.term || course.term === "") {
            course.term = "Unscheduled";
          }
        });
      }
    }
  };

  const groupCoursesByTerm = (courses: ParsedCourse[]) => {
    const result: Record<string, ParsedCourse[]> = {};
    
    courses.forEach(course => {
      if (course.term) {
        if (!result[course.term]) {
          result[course.term] = [];
        }
        result[course.term].push(course);
      }
    });
    
    return result;
  };

  const addCoursesToPlan = async (coursesByTerm: Record<string, ParsedCourse[]>) => {
    try {
      // Collect all unique course codes from the transcript to prepare for fetching
      const allTranscriptCourses = Object.values(coursesByTerm).flat();
      const uniqueSubjects = new Set<string>();
      
      allTranscriptCourses.forEach(course => {
        if (course.code.includes(' ')) {
          const [subjectCode] = course.code.split(' ', 1);
          uniqueSubjects.add(subjectCode.toUpperCase());
        }
      });
      
      console.log(`Found ${uniqueSubjects.size} unique subjects in transcript:`, Array.from(uniqueSubjects).join(', '));
      
      // Step 1: First check if we need to create a custom co-op sequence based on the transcript
      const termSequence = buildCustomSequenceFromTranscript(coursesByTerm);
      let sequenceUpdated = false;
      
      if (termSequence.length > 0) {
        console.log(`Created custom sequence from transcript: ${termSequence.join(', ')}`);
        try {
          // Update the plan's co-op sequence to match the transcript
          const sequenceResponse = await fetch(`/api/plans/${planId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coopSequence: "CUSTOM",
              customTerms: termSequence
            }),
          });
          
          if (sequenceResponse.ok) {
            console.log("Successfully updated plan to use custom sequence from transcript");
            sequenceUpdated = true;
          } else {
            console.error("Failed to update plan sequence:", await sequenceResponse.text());
          }
        } catch (error) {
          console.error("Error updating plan sequence:", error);
        }
      }
      
      // Step 2: Next, check existing courses in the plan and move them to the backlog if needed
      try {
        // Fetch current plan courses
        const existingCoursesResponse = await fetch(`/api/plans/${planId}/courses`);
        const existingCoursesData = await existingCoursesResponse.json();
        const existingCourses = existingCoursesData.planCourses || [];
        
        if (existingCourses.length > 0) {
          console.log(`Found ${existingCourses.length} existing courses in the plan`);
          
          // Find courses that aren't in the transcript but are in the plan
          const coursesToMove = [];
          
          // Create a set of transcript course codes for quick lookup
          const transcriptCourseCodes = new Set(
            allTranscriptCourses.map(course => {
              if (course.code.includes(' ')) {
                const [code, catalog] = course.code.split(' ', 2);
                return `${code.toUpperCase()}${catalog}`;
              }
              return course.code.replace(/\s+/g, '').toUpperCase();
            })
          );
          
          // Check each existing course
          for (const existingCourse of existingCourses) {
            const normalizedCode = `${existingCourse.course.courseCode}${existingCourse.course.catalogNumber}`.toUpperCase();
            
            // If the course is not in the transcript and not already in backlog, move it
            if (!transcriptCourseCodes.has(normalizedCode) && 
                existingCourse.term !== "Unscheduled") {
              coursesToMove.push({
                courseId: existingCourse.id,
                courseCode: `${existingCourse.course.courseCode} ${existingCourse.course.catalogNumber}`
              });
            }
          }
          
          if (coursesToMove.length > 0) {
            console.log(`Moving ${coursesToMove.length} existing courses to backlog`);
            
            // Move each course to backlog
            const movePromises = coursesToMove.map(course => 
              fetch(`/api/plans/${planId}/courses/${course.courseId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  term: "Unscheduled",
                  termIndex: null
                }),
              })
            );
            
            await Promise.all(movePromises);
            console.log("Successfully moved courses to backlog");
            
            toast({
              title: "Organized existing courses",
              description: `Moved ${coursesToMove.length} courses to the backlog that weren't in your transcript`,
            });
          }
        }
      } catch (error) {
        console.error("Error handling existing courses:", error);
        // Continue with transcript processing even if this step fails
      }
      
      // Step 3: Fetch courses with expanded result limit to ensure we get all potential matches
      const queryParams = new URLSearchParams({
        limit: '1000' // Request more courses to ensure we get everything we need
      });
      
      const coursesResponse = await fetch(`/api/courses?${queryParams.toString()}`);
      const coursesData = await coursesResponse.json();
      const availableCourses = coursesData.courses || [];
      
      console.log(`Fetched ${availableCourses.length} available courses from database`);
      
      // Log the first few available courses to help debug
      console.log("Sample available courses:", 
        availableCourses.slice(0, 5).map(c => `${c.courseCode} ${c.catalogNumber}`));
      
      // Check if we have courses for each subject in the transcript
      uniqueSubjects.forEach(subject => {
        const subjectCourses = availableCourses.filter(c => c.courseCode === subject);
        console.log(`Subject ${subject}: ${subjectCourses.length} courses available`);
      });
      
      // Function to normalize course codes for matching by removing spaces
      const normalizeCode = (code: string) => code.replace(/\s+/g, '').toUpperCase();
      
      // If no courses found in database, pre-create common courses from the transcript
      const needToAddCourses = Array.from(uniqueSubjects).every(subject => 
        !availableCourses.some(c => c.courseCode === subject)
      );
      
      if (needToAddCourses) {
        console.log("No courses found in database. Creating essential courses from transcript...");
        
        // First, collect all course codes from transcript
        const essentialCourses = [];
        
        for (const course of allTranscriptCourses) {
          if (course.code.includes(' ')) {
            const [courseCode, catalogNumber] = course.code.split(' ', 2);
            
            // Check if we already have this course code in our list
            if (!essentialCourses.some(c => 
              c.courseCode === courseCode.toUpperCase() && 
              c.catalogNumber === catalogNumber
            )) {
              essentialCourses.push({
                courseCode: courseCode.toUpperCase(),
                catalogNumber: catalogNumber,
                title: course.description || `${courseCode} ${catalogNumber}`,
                description: `Auto-created from transcript upload: ${course.description || 'No description available'}`,
                units: parseFloat(course.earned) || 0.5,
              });
            }
          }
        }
        
        console.log(`Preparing to create ${essentialCourses.length} essential courses...`);
        
        // Create all essential courses first
        for (const essentialCourse of essentialCourses) {
          try {
            const createResponse = await fetch('/api/courses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(essentialCourse),
            });
            
            if (createResponse.ok) {
              const newCourse = await createResponse.json();
              console.log(`Pre-created course: ${newCourse.courseCode} ${newCourse.catalogNumber}`);
              
              // Add to available courses list
              availableCourses.push(newCourse);
              
              // Also add to maps
              const fullCode = `${newCourse.courseCode} ${newCourse.catalogNumber}`;
              const normalizedKey = normalizeCode(`${newCourse.courseCode}${newCourse.catalogNumber}`);
              
              courseMap.set(normalizedKey, newCourse);
              courseMap.set(fullCode, newCourse);
              
              // Add to subject map
              if (!courseCodeMap.has(newCourse.courseCode)) {
                courseCodeMap.set(newCourse.courseCode, []);
              }
              courseCodeMap.get(newCourse.courseCode)?.push(newCourse);
            } else {
              console.error(`Failed to pre-create course: ${essentialCourse.courseCode} ${essentialCourse.catalogNumber}`);
            }
          } catch (error) {
            console.error(`Error pre-creating course: ${essentialCourse.courseCode} ${essentialCourse.catalogNumber}`, error);
          }
        }
        
        console.log(`Created ${availableCourses.length} courses in database`);
      }
      
      // Create a comprehensive mapping system for better course matching
      const courseMap = new Map();
      const courseCodeMap = new Map<string, any[]>();
      
      // Build multiple lookup maps for more robust matching
      availableCourses.forEach(course => {
        // Store the full official course code as the primary key
        const fullCode = `${course.courseCode} ${course.catalogNumber}`;
        
        // Store multiple formats of the same course code for flexible matching
        const normalizedKey = normalizeCode(`${course.courseCode}${course.catalogNumber}`);
        const spaceKey = fullCode.trim();
        
        // Main maps for exact and normalized lookup
        courseMap.set(normalizedKey, course);
        courseMap.set(spaceKey, course);
        
        // Also add to subject code map for finding courses by subject
        const subjectCode = course.courseCode.toUpperCase();
        if (!courseCodeMap.has(subjectCode)) {
          courseCodeMap.set(subjectCode, []);
        }
        courseCodeMap.get(subjectCode)?.push(course);
        
        // Add alternate formats
        // For example, both "CS135" and "CS 135" should match
        courseMap.set(normalizeCode(fullCode), course);
        courseMap.set(course.courseCode + course.catalogNumber, course);
        courseMap.set(fullCode.toUpperCase(), course);
      });
      
      // Debug: log a few available courses
      console.log("Sample available courses:", availableCourses.slice(0, 3).map(c => `${c.courseCode} ${c.catalogNumber}`));
      
      // Flatten all courses and log them
      const allParsedCourses = Object.values(coursesByTerm).flat();
      console.log("Sample parsed courses:", allParsedCourses.slice(0, 3).map(c => c.code));
      
      let totalAdded = 0;
      let failures = 0;
      
      // Add courses term by term
      for (const [term, courses] of Object.entries(coursesByTerm)) {
        console.log(`Processing ${courses.length} courses for term ${term}`);
        
        for (const course of courses) {
          // Try even more matching strategies in order of precision
          let dbCourse = findMatchingCourse(course, courseMap, courseCodeMap, availableCourses);
          
          if (dbCourse) {
            console.log(`Found match for ${course.code}: ${dbCourse.courseCode} ${dbCourse.catalogNumber}`);
            
            try {
              // Add the course to the plan with grade
              // Map term from transcript (e.g., "1A") to actual term for plan
              // Use term and termIndex appropriate for the custom sequence if we created one
              const termInfo = sequenceUpdated 
                ? mapTermToCustomSequence(term, termSequence) 
                : { term, termIndex: convertTermToIndex(term) };
              
              const response = await fetch(`/api/plans/${planId}/courses`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  courseId: dbCourse.id,
                  term: termInfo.term,
                  termIndex: termInfo.termIndex,
                  status: 'COMPLETED',
                  grade: course.grade,
                  numericGrade: getNumericGrade(course.grade)
                }),
              });
              
              if (response.ok) {
                totalAdded++;
                setProcessedCourses(prev => ({
                  ...prev,
                  successful: [...prev.successful, course.code]
                }));
              } else {
                // Try to get more detailed error info
                const errorData = await response.json().catch(() => ({}));
                
                if (errorData.error === 'Course already in plan') {
                  console.log(`Course ${course.code} is already in plan - skipping`);
                  // Consider this a success since it's already in the plan
                  setProcessedCourses(prev => ({
                    ...prev,
                    successful: [...prev.successful, course.code]
                  }));
                } else {
                  console.error(`API error adding course ${course.code}:`, errorData);
                  failures++;
                  setProcessedCourses(prev => ({
                    ...prev,
                    failed: [...prev.failed, course.code]
                  }));
                }
              }
            } catch (error) {
              console.error(`Error adding course ${course.code}:`, error);
              failures++;
            }
          } else {
            console.warn(`Course not found in database: ${course.code}`);
            
            // Try to split the course code for auto-creation
            if (course.code.includes(' ')) {
              try {
                const [courseCode, catalogNumber] = course.code.split(' ', 2);
                
                if (courseCode && catalogNumber) {
                  console.log(`Attempting to auto-create course: ${courseCode} ${catalogNumber}`);
                  
                  // Create a placeholder course
                  const createResponse = await fetch('/api/courses', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      courseCode: courseCode.toUpperCase(),
                      catalogNumber: catalogNumber,
                      title: course.description || `${courseCode} ${catalogNumber}`,
                      description: `Auto-created from transcript upload: ${course.description || 'No description available'}`,
                      units: parseFloat(course.earned) || 0.5,
                    }),
                  });
                  
                  if (createResponse.ok) {
                    const newCourse = await createResponse.json();
                    console.log(`Successfully created course: ${newCourse.courseCode} ${newCourse.catalogNumber}`);
                    
                    // Now add the newly created course to the plan
                    // Use term and termIndex appropriate for the custom sequence if we created one
                    const termInfo = sequenceUpdated 
                      ? mapTermToCustomSequence(term, termSequence) 
                      : { term, termIndex: convertTermToIndex(term) };
                    
                    const addResponse = await fetch(`/api/plans/${planId}/courses`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        courseId: newCourse.id,
                        term: termInfo.term,
                        termIndex: termInfo.termIndex,
                        status: 'COMPLETED',
                        grade: course.grade,
                        numericGrade: getNumericGrade(course.grade)
                      }),
                    });
                    
                    if (addResponse.ok) {
                      totalAdded++;
                      console.log(`Successfully added auto-created course to plan: ${course.code}`);
                      setProcessedCourses(prev => ({
                        ...prev,
                        successful: [...prev.successful, course.code]
                      }));
                    } else {
                      failures++;
                      console.error(`Failed to add auto-created course to plan: ${course.code}`);
                      setProcessedCourses(prev => ({
                        ...prev,
                        failed: [...prev.failed, course.code]
                      }));
                    }
                  } else {
                    failures++;
                    console.error(`Failed to auto-create course: ${course.code}`);
                    setProcessedCourses(prev => ({
                      ...prev,
                      failed: [...prev.failed, course.code]
                    }));
                  }
                } else {
                  failures++;
                  setProcessedCourses(prev => ({
                    ...prev,
                    failed: [...prev.failed, course.code]
                  }));
                }
              } catch (error) {
                console.error(`Error auto-creating course ${course.code}:`, error);
                failures++;
                setProcessedCourses(prev => ({
                  ...prev,
                  failed: [...prev.failed, course.code]
                }));
              }
            } else {
              failures++;
              setProcessedCourses(prev => ({
                ...prev,
                failed: [...prev.failed, course.code]
              }));
            }
          }
        }
      }
      
      console.log(`Finished processing: ${totalAdded} added, ${failures} failed`);
      
      // Show results
      let successMessage = `Added ${totalAdded} courses to your plan${failures > 0 ? ` (${failures} failed)` : ''}`;
      if (sequenceUpdated) {
        successMessage += `. Created a custom sequence based on your transcript.`;
      }
      
      // Show results
      if (totalAdded > 0) {
        toast({
          title: "Transcript processed successfully",
          description: successMessage,
        });
        
        // Close dialog and refresh
        setTimeout(() => {
          setIsOpen(false);
          onCoursesAdded();
        }, 1500);
      } else {
        setErrorMessage(`Failed to add courses. ${failures} courses could not be added.`);
      }
    } catch (error) {
      console.error("Error adding courses to plan:", error);
      setErrorMessage("Failed to add courses to your plan. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Function to build a custom sequence from the transcript terms
  const buildCustomSequenceFromTranscript = (coursesByTerm: Record<string, ParsedCourse[]>): string[] => {
    // Skip if no terms with courses
    if (Object.keys(coursesByTerm).length === 0) return [];
    
    // Get all unique terms from transcript (except Unscheduled)
    const terms = Object.keys(coursesByTerm).filter(term => term !== "Unscheduled");
    if (terms.length === 0) return [];
    
    // Standard Waterloo terms in order
    const standardTermOrder = ["1A", "1B", "2A", "2B", "3A", "3B", "4A", "4B"];
    
    // Check if the terms are all standard Waterloo terms
    const allTermsStandard = terms.every(term => standardTermOrder.includes(term));
    
    if (allTermsStandard) {
      // Sort by standard order
      terms.sort((a, b) => standardTermOrder.indexOf(a) - standardTermOrder.indexOf(b));
      
      // Detect coop pattern - look for gaps in the sequence
      const termIndices = terms.map(term => standardTermOrder.indexOf(term));
      let sequence: string[] = [];
      
      // For each pair of consecutive terms, check if there's a gap
      for (let i = 0; i < termIndices.length - 1; i++) {
        const current = termIndices[i];
        const next = termIndices[i + 1];
        
        // Add the current term
        sequence.push(standardTermOrder[current]);
        
        // If there's a gap, insert COOP terms
        if (next - current > 1) {
          // Add a COOP term for each gap
          for (let j = 0; j < next - current - 1; j++) {
            sequence.push("COOP");
          }
        }
      }
      
      // Add the last term
      if (termIndices.length > 0) {
        sequence.push(standardTermOrder[termIndices[termIndices.length - 1]]);
      }
      
      // If no sequence found, just return the sorted terms
      return sequence.length > 0 ? sequence : terms;
    } else {
      // If they're not all standard terms, just use them as is
      // Try to sort them if they're numbered
      return terms.sort();
    }
  };
  
  // Function to map a term (like "1A") to its position in a custom sequence
  const mapTermToCustomSequence = (term: string, sequence: string[]): { term: string, termIndex: number | null } => {
    // If term is Unscheduled, keep it as is
    if (term === "Unscheduled") {
      return { term, termIndex: null };
    }
    
    // Find the term in the sequence
    const index = sequence.indexOf(term);
    if (index !== -1) {
      return { term, termIndex: index };
    }
    
    // If term not found in custom sequence, place in Unscheduled
    return { term: "Unscheduled", termIndex: null };
  };

  // Helper function to find a matching course using multiple strategies
  const findMatchingCourse = (course: ParsedCourse, courseMap: Map<string, any>, courseCodeMap: Map<string, any[]>, allCourses: any[]) => {
    console.log(`Looking for course match: ${course.code}`);
    
    // Try exact match first
    if (courseMap.has(course.code)) {
      console.log(`Found exact match for ${course.code}`);
      return courseMap.get(course.code);
    }
    
    // Function to normalize code 
    const normalizeCode = (code: string) => code.replace(/\s+/g, '').toUpperCase();
    
    // Try normalized code match
    const normalizedCode = normalizeCode(course.code);
    if (courseMap.has(normalizedCode)) {
      console.log(`Found normalized match for ${course.code} using ${normalizedCode}`);
      return courseMap.get(normalizedCode);
    }
    
    // If the course code includes a space, try splitting and matching parts
    if (course.code.includes(' ')) {
      const [courseCode, catalogNum] = course.code.split(' ', 2);
      
      if (courseCode && catalogNum) {
        console.log(`Trying to match ${courseCode} ${catalogNum} by parts`);
        
        // Direct lookup in courses array (most reliable)
        const directMatch = allCourses.find(c => 
          c.courseCode.toUpperCase() === courseCode.toUpperCase() && 
          c.catalogNumber === catalogNum
        );
        
        if (directMatch) {
          console.log(`Direct match found for ${courseCode} ${catalogNum} in available courses`);
          return directMatch;
        }
        
        // Try various ways to combine them
        const alternateKeys = [
          `${courseCode}${catalogNum}`.toUpperCase(),
          `${courseCode} ${catalogNum}`.toUpperCase(),
          `${courseCode}${catalogNum}`,
          normalizeCode(`${courseCode} ${catalogNum}`),
          `${courseCode.toUpperCase()}${catalogNum}`, // Try uppercase code with number
          normalizeCode(`${courseCode}-${catalogNum}`) // Try with hyphen
        ];
        
        for (const key of alternateKeys) {
          if (courseMap.has(key)) {
            console.log(`Found alternate key match for ${course.code} using ${key}`);
            return courseMap.get(key);
          }
        }
        
        // Try looking up by subject code and then matching catalog number
        if (courseCodeMap.has(courseCode.toUpperCase())) {
          const subjectCourses = courseCodeMap.get(courseCode.toUpperCase());
          console.log(`Found ${subjectCourses?.length || 0} courses for subject ${courseCode.toUpperCase()}`);
          
          // Find the closest match by catalog number
          const match = subjectCourses?.find(c => 
            c.catalogNumber === catalogNum || 
            normalizeCode(c.catalogNumber) === normalizeCode(catalogNum)
          );
          
          if (match) {
            console.log(`Found subject match for ${course.code}: ${match.courseCode} ${match.catalogNumber}`);
            return match;
          }
          
          // Last resort: try fuzzy matching on catalog number if it's a common subject
          const fuzzyMatch = subjectCourses?.find(c => {
            // Strip any non-digit characters for comparison
            const cleanCatalog = c.catalogNumber.replace(/\D/g, '');
            const cleanInput = catalogNum.replace(/\D/g, '');
            return cleanCatalog === cleanInput;
          });
          
          if (fuzzyMatch) {
            console.log(`Fuzzy matched ${course.code} to ${fuzzyMatch.courseCode} ${fuzzyMatch.catalogNumber}`);
            return fuzzyMatch;
          }
        }
        
        // Check available courses directly with case insensitive matching
        console.log(`Trying direct case-insensitive search for ${courseCode} ${catalogNum}`);
        const caseInsensitiveMatch = allCourses.find(c => 
          c.courseCode.toUpperCase() === courseCode.toUpperCase() && 
          c.catalogNumber.toUpperCase() === catalogNum.toUpperCase()
        );
        
        if (caseInsensitiveMatch) {
          console.log(`Found case-insensitive match: ${caseInsensitiveMatch.courseCode} ${caseInsensitiveMatch.catalogNumber}`);
          return caseInsensitiveMatch;
        }
      }
    }
    
    return null;
  };
  
  // Helper function to convert term names to appropriate term indexes
  // This ensures the courses get put in the right slots regardless of co-op sequence
  const convertTermToIndex = (term: string): number | null => {
    // Standard Waterloo terms
    const termMap: Record<string, number> = {
      "1A": 0, "1B": 1, "2A": 2, "2B": 3, "3A": 4, "3B": 5, "4A": 6, "4B": 7
    };
    
    // Special handling for transfer/unscheduled courses
    if (term === "Transfer" || term === "Unscheduled") {
      return -1; // Use -1 to indicate unscheduled
    }
    
    return term in termMap ? termMap[term] : null;
  };

  // Convert letter grades to numeric values for calculations
  const getNumericGrade = (grade: string | undefined): number | null => {
    if (!grade) return null;
    
    // Clean the grade string
    const cleanGrade = grade.trim().toUpperCase();
    
    // Handle special case: if the grade looks like a unit value (0.5, 0.25, etc)
    // this is commonly mistaken for a grade in transcripts
    if (/^0\.\d+$/.test(cleanGrade)) {
      console.log(`Detected unit value mistakenly used as grade: ${cleanGrade}`);
      return null; // Return null for unit values to avoid using them as grades
    }
    
    // Standard letter grade mapping
    const gradeMap: Record<string, number> = {
      'A+': 95, 'A': 90, 'A-': 85,
      'B+': 82, 'B': 78, 'B-': 75,
      'C+': 72, 'C': 68, 'C-': 65,
      'D+': 62, 'D': 58, 'D-': 55,
      'F': 45,
      'CR': 70, // Credit - assume passing grade
      'P': 70,  // Pass
      'NCR': 45, // No Credit - assume failing grade
      'INC': null, // Incomplete
      'DNW': 0,  // Did Not Write
      'AEG': 70,  // Aegrotat - assume passing
      'VWD': null, // Voluntary withdrawal - no grade
      'WD': null, // Withdrawal - no grade
      'AUD': null // Audit - no grade
    };
    
    // Check if we have a direct match in our mapping
    if (cleanGrade in gradeMap) {
      return gradeMap[cleanGrade];
    }
    
    // Try to parse numeric grade (percentage format)
    const numGrade = parseFloat(cleanGrade);
    if (!isNaN(numGrade)) {
      // Validate the numeric grade is in reasonable range
      if (numGrade >= 0 && numGrade <= 100) {
        return numGrade;
      } else {
        console.log(`Numeric grade out of range: ${numGrade}`);
        return null;
      }
    }
    
    // Try to extract numeric component from grade formats like "85%" or "85/100"
    const percentMatch = cleanGrade.match(/(\d+)%?/);
    if (percentMatch) {
      const extracted = parseFloat(percentMatch[1]);
      // Validate range
      if (extracted >= 0 && extracted <= 100) {
        return extracted;
      }
    }
    
    // Try to handle fraction format like "85/100"
    const fractionMatch = cleanGrade.match(/(\d+)\/(\d+)/);
    if (fractionMatch) {
      const numerator = parseFloat(fractionMatch[1]);
      const denominator = parseFloat(fractionMatch[2]);
      if (denominator > 0) {
        const calculated = (numerator / denominator) * 100;
        // Validate the calculated grade is reasonable
        if (calculated >= 0 && calculated <= 100) {
          return calculated;
        }
      }
    }
    
    // Log unrecognized grade format for debugging
    console.log(`Unrecognized grade format: "${grade}"`);
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-sm font-medium">
          <UploadIcon className="h-4 w-4" />
          Upload Transcript
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" aria-describedby="transcript-upload-description">
        <DialogHeader>
          <DialogTitle>Upload your transcript</DialogTitle>
        </DialogHeader>
        <p id="transcript-upload-description" className="sr-only">Upload your unofficial Waterloo transcript PDF to automatically add completed courses to your plan.</p>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <div className="flex flex-col items-center space-y-4">
              <FileIcon className="h-10 w-10 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  Upload your Waterloo transcript
                </p>
                <p className="text-xs text-muted-foreground">
                  Only PDF format is supported. Data is processed locally and not saved on our servers.
                </p>
              </div>
              <label className="relative">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className={isProcessing ? "opacity-50 cursor-not-allowed" : ""}
                  disabled={isProcessing}
                >
                  Browse Files
                </Button>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  onChange={extractText} 
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
              </label>
            </div>
          </div>
          
          {/* Processing indicator */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="text-center text-sm">Processing transcript...</p>
            </div>
          )}
          
          {/* Error message */}
          {errorMessage && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive flex items-start gap-2">
              <AlertCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Processing failed</p>
                <p className="text-xs">{errorMessage}</p>
              </div>
            </div>
          )}
          
          {/* Parsed courses */}
          {parsedCourses.length > 0 && !isProcessing && !errorMessage && (
            <div className="p-3 rounded-md bg-green-50 text-green-700 flex items-start gap-2">
              <CheckCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm">Transcript processed</p>
                <p className="text-xs">Found {parsedCourses.length} courses</p>
                
                {/* Display successful and failed courses */}
                {processedCourses.successful.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium">Successfully added ({processedCourses.successful.length}):</p>
                    <div className="max-h-20 overflow-y-auto mt-1">
                      <p className="text-xs">{processedCourses.successful.join(', ')}</p>
                    </div>
                  </div>
                )}
                
                {processedCourses.failed.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-amber-700">Failed to add ({processedCourses.failed.length}):</p>
                    <div className="max-h-20 overflow-y-auto mt-1">
                      <p className="text-xs text-amber-700">{processedCourses.failed.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}