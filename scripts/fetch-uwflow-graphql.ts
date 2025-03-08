import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

type UWFlowCourseResponse = {
  data: {
    course_search_index: Array<{
      course_id: number;
      name: string;
      code: string;
      useful: number | null;
      liked: number | null;
      easy: number | null;
      ratings: number;
      __typename: string;
    }>;
  };
};

type UWFlowCourseDetailResponse = {
  data: {
    course: Array<{
      id: number;
      code: string;
      name: string;
      description: string;
      antireqs: string;
      prereqs: string;
      coreqs: string;
    }>;
  };
};

// Add a new type for the course with details
type CourseWithDetails = UWFlowCourseResponse["data"]["course_search_index"][0] & {
  description: string;
  antireqs: string;
  prereqs: string;
  coreqs: string;
};

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

async function fetchCourseDetails(code: string): Promise<UWFlowCourseDetailResponse['data']['course'][0] | null> {
  return retry(async () => {
    const res = await fetch("https://uwflow.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        operationName: "getCourse",
        variables: { code },
        query: "query getCourse($code: String) { course(where: {code: {_eq: $code}}) { id code name description antireqs prereqs coreqs __typename }}",
      }),
    });

    if (!res.ok) return null;

    const data = await res.json() as UWFlowCourseDetailResponse;
    return data.data.course[0] ?? null;
  });
}

// Helper function to process courses in batches with proper typing
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
    await delay(500);
  }
  return results as R[];
}

async function fetchUWFlowData(): Promise<CourseWithDetails[]> {
  console.log("Fetching courses from UWFlow...");
  const res = await fetch("https://uwflow.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      operationName: "exploreAll",
      variables: {},
      query: "query exploreAll { course_search_index { ...CourseSearch __typename } } fragment CourseSearch on course_search_index { course_id name code useful ratings liked easy __typename }",
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch from UWFlow: ${res.statusText}`);
  }

  const { data } = await res.json() as UWFlowCourseResponse;
  console.log(`Fetched ${data.course_search_index.length} courses, fetching details...`);

  // Process courses in smaller batches
  const coursesWithDetails = await processBatch(
    data.course_search_index,
    30, // smaller batch size to be gentler on the API
    async (course) => {
      const details = await fetchCourseDetails(course.code);
      if (!details) {
        console.log(`No details found for ${course.code}, skipping`);
        return null;
      }
      return {
        ...course,
        description: details.description ?? '',
        antireqs: details.antireqs ?? '',
        prereqs: details.prereqs ?? '',
        coreqs: details.coreqs ?? '',
      };
    }
  );

  return coursesWithDetails;
}

async function saveToDatabase(courses: CourseWithDetails[]) {
  console.log(`Saving ${courses.length} courses to database...`);
  
  let addedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const course of courses) {
    try {
      // Extract subject code and catalog number
      const [subjectCode, catalogNumber] = course.code.split(/\s+/);
      
      if (!subjectCode || !catalogNumber) {
        console.warn(`Invalid course code format: ${course.code}`);
        continue;
      }
      
      // Calculate units - most UW courses are 0.5 units
      const units = 0.5;
      
      // Check if course already exists
      const existingCourse = await prisma.course.findUnique({
        where: {
          courseCode_catalogNumber: {
            courseCode: subjectCode,
            catalogNumber: catalogNumber
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
            title: course.name,
            description: course.description || null,
            units,
            prerequisites: course.prereqs || null,
            corequisites: course.coreqs || null,
            antirequisites: course.antireqs || null
          }
        });
        console.log(`Updated course: ${subjectCode} ${catalogNumber}`);
        updatedCount++;
      } else {
        // Create new course
        await prisma.course.create({
          data: {
            courseCode: subjectCode,
            catalogNumber,
            title: course.name,
            description: course.description || null,
            units,
            prerequisites: course.prereqs || null,
            corequisites: course.coreqs || null,
            antirequisites: course.antireqs || null
          }
        });
        console.log(`Added new course: ${subjectCode} ${catalogNumber}`);
        addedCount++;
      }
    } catch (error) {
      console.error(`Error saving course ${course.code}:`, error);
      errorCount++;
    }
  }
  
  console.log('\nDatabase update complete:');
  console.log(`- Courses added: ${addedCount}`);
  console.log(`- Courses updated: ${updatedCount}`);
  console.log(`- Errors: ${errorCount}`);
  
  return { addedCount, updatedCount, errorCount };
}

async function saveData(fileName: string, data: any) {
  const fs = require('fs');
  const path = require('path');
  
  // Create data directory if it doesn't exist
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const filePath = path.join(dataDir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Data saved to ${filePath}`);
}

async function main() {
  try {
    console.log('Starting UWFlow course import with GraphQL...');
    
    // Fetch all courses from UWFlow
    const courses = await fetchUWFlowData();
    console.log(`Successfully fetched ${courses.length} courses from UWFlow`);
    
    // Save raw data to a file for backup
    await saveData('uwflow_courses.json', courses);
    
    // Save courses to database
    await saveToDatabase(courses);
    
    // Count total courses in database for verification
    const courseCount = await prisma.course.count();
    console.log(`\nTotal courses in database: ${courseCount}`);
    
  } catch (error) {
    console.error('Error during import process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Install required package: npm install node-fetch@2 @types/node-fetch
main().catch(console.error);