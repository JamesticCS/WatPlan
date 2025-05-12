/**
 * Script to import missing courses from UWFlow data
 * 
 * This script:
 * 1. Uses the existing all_courses.json data file 
 * 2. Correctly formats and imports all courses that are missing from the database
 * 3. Focuses only on adding new courses rather than updating existing ones
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper function to parse UWFlow course code format
function parseCourseCode(code: string): { courseCode: string, catalogNumber: string } | null {
  // For codes like "MATH 135", "CS 241", etc.
  const spaceMatch = code.match(/^([A-Za-z]+)\s+([A-Za-z0-9]+)$/);
  if (spaceMatch) {
    return {
      courseCode: spaceMatch[1].toUpperCase(),
      catalogNumber: spaceMatch[2]
    };
  }
  
  // For codes like "actsc231", "amath251", etc.
  const noSpaceMatch = code.match(/^([a-zA-Z]+)([0-9]+[a-zA-Z]*)$/);
  if (noSpaceMatch) {
    return {
      courseCode: noSpaceMatch[1].toUpperCase(),
      catalogNumber: noSpaceMatch[2]
    };
  }
  
  // If we can't parse it properly
  console.log(`Could not parse course code: ${code}`);
  return null;
}

async function importMissingCourses() {
  try {
    console.log('Starting import of missing courses...');
    
    // Load the UWFlow data file
    const dataFile = path.join(process.cwd(), 'data', 'uwflow', 'all_courses.json');
    if (!fs.existsSync(dataFile)) {
      throw new Error('UWFlow data file not found. Please run the scraper script first.');
    }
    
    const courses = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    console.log(`Loaded ${courses.length} courses from UWFlow data file.`);
    
    // Get all existing course codes from database for comparison
    const existingCourses = await prisma.course.findMany({
      select: {
        courseCode: true,
        catalogNumber: true
      }
    });
    
    // Create a Set for faster lookup of existing courses
    const existingCourseSet = new Set();
    existingCourses.forEach(course => {
      existingCourseSet.add(`${course.courseCode}-${course.catalogNumber}`);
    });
    
    console.log(`Database has ${existingCourses.length} existing courses.`);
    
    // Import courses in batches to avoid overwhelming the database
    const batchSize = 100;
    let addedCount = 0;
    let skippedCount = 0;
    let alreadyExistsCount = 0;
    let errorCount = 0;
    
    // Loop through all courses
    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, Math.min(i + batchSize, courses.length));
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(courses.length / batchSize)}...`);
      
      const promises = batch.map(async (course) => {
        try {
          // Parse course code
          const parsedCode = parseCourseCode(course.code);
          if (!parsedCode) {
            skippedCount++;
            return null;
          }
          
          const { courseCode, catalogNumber } = parsedCode;
          
          // Check if course already exists in our set
          if (existingCourseSet.has(`${courseCode}-${catalogNumber}`)) {
            alreadyExistsCount++;
            return null;
          }
          
          // Default to 0.5 units if not specified
          const units = 0.5;
          
          // Create new course
          await prisma.course.create({
            data: {
              courseCode,
              catalogNumber,
              title: course.name,
              description: course.description || null,
              units,
              prerequisites: course.prereqs || null,
              corequisites: course.coreqs || null,
              antirequisites: course.antireqs || null
            }
          });
          
          console.log(`Added new course: ${courseCode} ${catalogNumber}`);
          addedCount++;
          
          // Add to our set so we don't try to add it again
          existingCourseSet.add(`${courseCode}-${catalogNumber}`);
          
          return { courseCode, catalogNumber };
        } catch (error) {
          console.error(`Error importing course ${course.code}:`, error);
          errorCount++;
          return null;
        }
      });
      
      await Promise.all(promises);
    }
    
    console.log('\nImport summary:');
    console.log(`- New courses added: ${addedCount}`);
    console.log(`- Courses already existed: ${alreadyExistsCount}`);
    console.log(`- Courses skipped (parsing error): ${skippedCount}`);
    console.log(`- Errors: ${errorCount}`);
    
    // Count total courses in database for verification
    const courseCount = await prisma.course.count();
    console.log(`\nTotal courses in database after import: ${courseCount}`);
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Main function
async function main() {
  try {
    await importMissingCourses();
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Error running import:', error);
    process.exit(1);
  }
}

main().catch(console.error);