/**
 * Script to fetch Waterloo course data from UWFlow
 * 
 * This script:
 * 1. Fetches course data from UWFlow API
 * 2. Saves the data locally
 * 3. Imports the courses into the database
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// UWFlow API URL for course data (updated to use the working GraphQL endpoint)
const UWFLOW_API_URL = 'https://uwflow.com/graphql';

// Helper function to wait between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to retry failed requests
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await delay(delayMs);
      return retry(fn, retries - 1, delayMs * 2);
    }
    throw error;
  }
}

// GraphQL query to fetch all courses (basic info)
const ALL_COURSES_QUERY = `
query exploreAll { 
  course_search_index { 
    course_id 
    name 
    code 
    useful 
    ratings 
    liked 
    easy 
    __typename 
  } 
}`;

// GraphQL query to fetch course details
const COURSE_DETAILS_QUERY = `
query getCourse($code: String) { 
  course(where: {code: {_eq: $code}}) { 
    id 
    code 
    name 
    description 
    antireqs 
    prereqs 
    coreqs 
    __typename 
  }
}`;

// Define UWFlow course structure
interface UWFlowCourse {
  course_id: number;
  name: string;
  code: string;
  useful: number | null;
  liked: number | null;
  easy: number | null;
  ratings: number;
  __typename: string;
}

// Define course details structure
interface UWFlowCourseDetail {
  id: number;
  code: string;
  name: string;
  description: string;
  antireqs: string;
  prereqs: string;
  coreqs: string;
  __typename: string;
}

// Combined course with details
interface CourseWithDetails extends UWFlowCourse {
  description: string;
  antireqs: string;
  prereqs: string;
  coreqs: string;
}

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
  return null;
}

// Fetch basic info for all courses
async function fetchAllCourses(): Promise<UWFlowCourse[]> {
  try {
    console.log('Fetching all courses from UWFlow...');
    
    const response = await axios.post(UWFLOW_API_URL, {
      operationName: "exploreAll",
      variables: {},
      query: ALL_COURSES_QUERY
    });
    
    if (!response.data.data || !response.data.data.course_search_index) {
      throw new Error(`UWFlow API returned unexpected response: ${JSON.stringify(response.data)}`);
    }
    
    return response.data.data.course_search_index;
  } catch (error) {
    console.error('Error fetching courses from UWFlow:', error);
    throw error;
  }
}

// Fetch details for a specific course
async function fetchCourseDetails(code: string): Promise<UWFlowCourseDetail | null> {
  return retry(async () => {
    try {
      const response = await axios.post(UWFLOW_API_URL, {
        operationName: "getCourse",
        variables: { code: code.toLowerCase() },
        query: COURSE_DETAILS_QUERY
      });
      
      if (!response.data.data || !response.data.data.course) {
        return null;
      }
      
      return response.data.data.course[0] || null;
    } catch (error) {
      console.error(`Error fetching details for course ${code}:`, error);
      throw error;
    }
  });
}

// Helper function to process courses in batches
async function processBatch<T, R>(
  items: T[],
  batchSize: number,
  processFn: (item: T) => Promise<R | null>
): Promise<R[]> {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(items.length / batchSize)}...`);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          return await processFn(item);
        } catch (error) {
          console.error(`Failed to process item:`, error);
          return null;
        }
      })
    );
    results.push(...batchResults.filter(Boolean));
    // Wait between batches to avoid overloading the API
    await delay(100);
  }
  return results as R[];
}

// Fetch all courses with full details
async function fetchAllCoursesWithDetails(): Promise<CourseWithDetails[]> {
  try {
    // Create directory for storing course data
    const dataDir = path.join(process.cwd(), 'data', 'uwflow');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Fetch all courses (basic info)
    const allCourses = await fetchAllCourses();
    console.log(`Fetched ${allCourses.length} courses from UWFlow, fetching details...`);
    
    // Save basic course data for safety
    const basicCoursesFile = path.join(dataDir, 'basic_courses.json');
    fs.writeFileSync(basicCoursesFile, JSON.stringify(allCourses, null, 2));
    
    // Process courses in batches to get full details
    const coursesWithDetails = await processBatch(
      allCourses,
      50, // batch size
      async (course): Promise<CourseWithDetails | null> => {
        const details = await fetchCourseDetails(course.code);
        if (!details) {
          console.warn(`No details found for course ${course.code}`);
          return {
            ...course,
            description: '',
            antireqs: '',
            prereqs: '',
            coreqs: '',
          };
        }
        
        return {
          ...course,
          description: details.description || '',
          antireqs: details.antireqs || '',
          prereqs: details.prereqs || '',
          coreqs: details.coreqs || '',
        };
      }
    );
    
    console.log(`Fetched details for ${coursesWithDetails.length} courses`);
    
    // Save full course data
    const fullCoursesFile = path.join(dataDir, 'all_courses.json');
    fs.writeFileSync(fullCoursesFile, JSON.stringify(coursesWithDetails, null, 2));
    
    return coursesWithDetails;
  } catch (error) {
    console.error('Error fetching all courses with details:', error);
    throw error;
  }
}

// Process and save courses to the database
async function saveCourseDataToDatabase(courses: CourseWithDetails[]) {
  console.log(`Importing ${courses.length} courses to database...`);
  
  let addedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  for (const uwCourse of courses) {
    try {
      // Parse course code
      const parsedCode = parseCourseCode(uwCourse.code);
      
      if (!parsedCode) {
        skippedCount++;
        continue;
      }
      
      const { courseCode, catalogNumber } = parsedCode;
      
      // Calculate units from credit (default to 0.5)
      let units = 0.5;
      
      // Check if course already exists
      const existingCourse = await prisma.course.findUnique({
        where: {
          courseCode_catalogNumber: {
            courseCode,
            catalogNumber
          }
        }
      });
      
      if (existingCourse) {
        // Update existing course
        await prisma.course.update({
          where: {
            id: existingCourse.id
          },
          data: {
            title: uwCourse.name,
            description: uwCourse.description || null,
            units,
            prerequisites: uwCourse.prereqs || null,
            corequisites: uwCourse.coreqs || null,
            antirequisites: uwCourse.antireqs || null
          }
        });
        console.log(`Updated course: ${courseCode} ${catalogNumber}`);
        updatedCount++;
      } else {
        // Create new course
        await prisma.course.create({
          data: {
            courseCode,
            catalogNumber,
            title: uwCourse.name,
            description: uwCourse.description || null,
            units,
            prerequisites: uwCourse.prereqs || null,
            corequisites: uwCourse.coreqs || null,
            antirequisites: uwCourse.antireqs || null
          }
        });
        console.log(`Added new course: ${courseCode} ${catalogNumber}`);
        addedCount++;
      }
    } catch (error) {
      console.error(`Error importing course ${uwCourse.code}:`, error);
      errorCount++;
    }
  }
  
  console.log('\nImport summary:');
  console.log(`- New courses added: ${addedCount}`);
  console.log(`- Courses updated: ${updatedCount}`);
  console.log(`- Courses skipped: ${skippedCount}`);
  console.log(`- Errors: ${errorCount}`);
  
  return { addedCount, updatedCount, errorCount, skippedCount };
}

// Use previously saved data if available to avoid hitting the API too much
async function importFromSavedData(): Promise<CourseWithDetails[]> {
  const dataFile = path.join(process.cwd(), 'data', 'uwflow', 'all_courses.json');
  
  if (fs.existsSync(dataFile)) {
    console.log('Using previously saved UWFlow data...');
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    return data;
  }
  
  // If no saved data, fetch from API
  console.log('No saved UWFlow data found, fetching from API...');
  return await fetchAllCoursesWithDetails();
}

// Main function
async function main() {
  try {
    console.log('Starting UWFlow course import...');
    
    // Ask if we should use cached data
    const useCache = process.argv.includes('--use-cache');
    
    let courses;
    if (useCache) {
      courses = await importFromSavedData();
    } else {
      courses = await fetchAllCoursesWithDetails();
    }
    
    // Save to database
    await saveCourseDataToDatabase(courses);
    
    // Count total courses in database for verification
    const courseCount = await prisma.course.count();
    console.log(`\nTotal courses in database: ${courseCount}`);
    
    console.log('\nCourse import from UWFlow completed successfully!');
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch(console.error);