/**
 * Script to fetch and import all Waterloo courses
 * 
 * This script:
 * 1. Scrapes course data from the Waterloo undergraduate calendar
 * 2. Saves the data as JSON files
 * 3. Imports the courses into the database
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Comprehensive list of Waterloo subjects
const ALL_SUBJECT_CODES = [
  // Math/CS Subjects
  'ACTSC', 'AMATH', 'CO', 'CS', 'MATH', 'MATBUS', 'PMATH', 'STAT',
  
  // Engineering Subjects
  'AE', 'ARCH', 'BME', 'CHE', 'CIVE', 'ECE', 'ENVE', 'GENE', 'GEOE', 'ME', 'MTE', 'NE', 'SE', 'SYDE',
  
  // Science Subjects
  'BIOL', 'CHEM', 'EARTH', 'PHYS', 'SCI', 'SCBUS',
  
  // Arts Subjects
  'ANTH', 'ARTS', 'CI', 'CLAS', 'CROAT', 'DAC', 'DRAMA', 'EASIA', 'ENGL', 'FINE', 'FR', 'GER', 'GERON', 'GRK', 
  'HIST', 'HUMSC', 'ITAL', 'ITALST', 'JAPAN', 'JS', 'KOREA', 'LAT', 'MEDVL', 'MUSIC', 'PHIL', 'PORT', 'PSCI', 
  'PSYCH', 'RS', 'RUSS', 'SI', 'SMF', 'SOC', 'SPAN', 'SPCOM', 'VCULT',
  
  // Environment Subjects
  'ENBUS', 'ERS', 'GEOG', 'INDEV', 'INTEG', 'INTST', 'PLAN', 'REC', 'TOUR',
  
  // Business/Economics
  'AFM', 'BUS', 'COMM', 'ECON', 'HRM', 'MGMT', 'MSCI', 'ARBUS',
  
  // Health/Applied Health
  'HLTH', 'KIN', 'AHS',
  
  // Other Important Subjects
  'ASL', 'EMLS', 'ESL', 'GLOBAL', 'GSJ', 'INDG', 'LS', 'MOHAWK', 'OPTOM', 'PACS', 'PD', 'PDARCH', 'PDPHRM', 
  'SMT', 'STV', 'SWK', 'UNIV', 'WIL', 'WKRPT'
];

// Base URL for course catalog (using 2023-2024 calendar as the 2024-2025 calendar has a new format)
const BASE_URL = 'https://ugradcalendar.uwaterloo.ca/2324/COURSE/';

// Scrape courses for a single subject code
async function scrapeCoursesBySubject(subjectCode: string) {
  try {
    console.log(`Scraping courses for ${subjectCode}...`);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data', 'courses');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Fetch the page content
    const url = `${BASE_URL}${subjectCode}`;
    const response = await axios.get(url);
    const html = response.data;
    
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    // Extract courses
    const courses: any[] = [];
    
    // Find course blocks in the 2023-2024 catalog format
    $('center table tr').each((i, element) => {
      try {
        // Skip rows with no course data or description rows (which have colspan)
        const cells = $(element).find('td');
        if (cells.length < 2 || $(cells[0]).attr('colspan')) return;
        
        // Extract course code and title from the table
        const courseText = $(cells[0]).text().trim();
        const courseTitle = $(cells[1]).text().trim();
        
        // Parse course code and catalog number
        const codeMatch = courseText.match(/([A-Z]{2,})\s+(\d{3}[A-Z]?)/);
        if (!codeMatch) return;
        
        const courseCode = codeMatch[1];
        const catalogNumber = codeMatch[2];
        
        // Get the course description - in the 2023-2024 calendar, it's typically in the next row
        const nextRow = $(element).next('tr');
        let courseDescription = '';
        
        if (nextRow.length) {
          const descCell = nextRow.find('td[colspan]');
          if (descCell.length) {
            courseDescription = descCell.text().trim();
          }
        }
        
        // Extract units (credit value) - handle different formats
        let units = 0.5; // Default to 0.5 if not found
        
        // Try different patterns for units
        const unitsPatterns = [
          /(\d+\.\d+)\s+units?/i,
          /(\d+\.\d+)\s+credit/i,
          /(\d+\.\d+)\s+unit\s+course/i
        ];
        
        for (const pattern of unitsPatterns) {
          const match = courseDescription.match(pattern);
          if (match) {
            units = parseFloat(match[1]);
            break;
          }
        }
        
        // Extract prerequisites, corequisites, and antirequisites
        let prerequisites = '';
        let corequisites = '';
        let antirequisites = '';
        
        // Handle different spellings and formats
        const prereqPatterns = ['Prereq:', 'Prerequisite:', 'Prerequisites:'];
        const coreqPatterns = ['Coreq:', 'Corequisite:', 'Corequisites:'];
        const antireqPatterns = ['Antireq:', 'Antirequisite:', 'Antirequisites:'];
        
        // Find prerequisites
        for (const pattern of prereqPatterns) {
          if (courseDescription.includes(pattern)) {
            let endIndex = courseDescription.length;
            
            // Find the next section if any
            for (const endPattern of [...coreqPatterns, ...antireqPatterns]) {
              const patternIndex = courseDescription.indexOf(endPattern);
              if (patternIndex > courseDescription.indexOf(pattern) && patternIndex < endIndex) {
                endIndex = patternIndex;
              }
            }
            
            prerequisites = courseDescription
              .substring(courseDescription.indexOf(pattern) + pattern.length, endIndex)
              .trim();
            break;
          }
        }
        
        // Find corequisites
        for (const pattern of coreqPatterns) {
          if (courseDescription.includes(pattern)) {
            let endIndex = courseDescription.length;
            
            // Find the antireq section if it exists
            for (const endPattern of antireqPatterns) {
              const patternIndex = courseDescription.indexOf(endPattern);
              if (patternIndex > courseDescription.indexOf(pattern) && patternIndex < endIndex) {
                endIndex = patternIndex;
              }
            }
            
            corequisites = courseDescription
              .substring(courseDescription.indexOf(pattern) + pattern.length, endIndex)
              .trim();
            break;
          }
        }
        
        // Find antirequisites
        for (const pattern of antireqPatterns) {
          if (courseDescription.includes(pattern)) {
            antirequisites = courseDescription
              .substring(courseDescription.indexOf(pattern) + pattern.length)
              .trim();
            break;
          }
        }
        
        courses.push({
          courseCode,
          catalogNumber,
          title: courseTitle,
          description: courseDescription,
          units,
          prerequisites,
          corequisites,
          antirequisites
        });
      } catch (err) {
        console.warn(`Error parsing course element: ${err}`);
      }
    });
    
    console.log(`Scraped ${courses.length} courses for ${subjectCode}`);
    
    // Save the scraped data
    const outputFilePath = path.join(dataDir, `${subjectCode.toLowerCase()}.json`);
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify({ 
        subjectCode, 
        courses, 
        scrapedAt: new Date().toISOString() 
      }, null, 2)
    );
    
    console.log(`Saved ${subjectCode} course data to ${outputFilePath}`);
    
    return { subjectCode, courseCount: courses.length };
  } catch (error) {
    console.error(`Error scraping ${subjectCode} courses:`, error);
    return { subjectCode, courseCount: 0, error: true };
  }
}

// Save all scraped courses to the database
async function saveCoursesToDatabase() {
  const dataDir = path.join(process.cwd(), 'data', 'courses');
  if (!fs.existsSync(dataDir)) {
    console.error('No course data found. Run the scraper first.');
    return;
  }
  
  let totalImported = 0;
  let totalErrors = 0;
  
  // Get all JSON files in the courses directory
  const files = fs.readdirSync(dataDir).filter(file => file.endsWith('.json'));
  
  for (const file of files) {
    try {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const { courses } = data;
      
      console.log(`Importing ${courses.length} courses from ${file}...`);
      
      // Loop through each course and insert into database
      for (const course of courses) {
        try {
          // Check if course already exists
          const existingCourse = await prisma.course.findUnique({
            where: {
              courseCode_catalogNumber: {
                courseCode: course.courseCode,
                catalogNumber: course.catalogNumber
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
                title: course.title,
                description: course.description,
                units: course.units,
                prerequisites: course.prerequisites,
                corequisites: course.corequisites,
                antirequisites: course.antirequisites
              }
            });
            console.log(`Updated course: ${course.courseCode} ${course.catalogNumber}`);
          } else {
            // Create new course
            await prisma.course.create({
              data: {
                courseCode: course.courseCode,
                catalogNumber: course.catalogNumber,
                title: course.title,
                description: course.description,
                units: course.units,
                prerequisites: course.prerequisites,
                corequisites: course.corequisites,
                antirequisites: course.antirequisites
              }
            });
            console.log(`Added new course: ${course.courseCode} ${course.catalogNumber}`);
          }
          
          totalImported++;
        } catch (err) {
          console.error(`Error importing course ${course.courseCode} ${course.catalogNumber}:`, err);
          totalErrors++;
        }
      }
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
    }
  }
  
  console.log(`\nImport complete:`);
  console.log(`- Successfully imported/updated ${totalImported} courses`);
  console.log(`- Errors: ${totalErrors}`);
}

// Main function to scrape and import all courses
async function main() {
  try {
    console.log('Starting comprehensive Waterloo course import...');
    
    // Create a summary table to keep track of progress
    console.log('='.repeat(80));
    console.log('| Subject | Status   | Courses Scraped |');
    console.log('|' + '-'.repeat(78) + '|');
    
    let totalScraped = 0;
    
    // Scrape each subject code
    for (const subjectCode of ALL_SUBJECT_CODES) {
      try {
        process.stdout.write(`| ${subjectCode.padEnd(8)} | Scraping... `);
        
        const result = await scrapeCoursesBySubject(subjectCode);
        
        if (result.error) {
          process.stdout.write(`Failed    | ${'0'.padEnd(14)} |\n`);
        } else {
          process.stdout.write(`Success   | ${result.courseCount.toString().padEnd(14)} |\n`);
          totalScraped += result.courseCount;
        }
        
        // Small delay to be nice to the server
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        process.stdout.write(`Error     | ${'0'.padEnd(14)} |\n`);
        console.error(`Error with ${subjectCode}:`, error);
      }
    }
    
    console.log('='.repeat(80));
    console.log(`Total courses scraped: ${totalScraped}`);
    
    // Import all scraped courses to the database
    console.log('\nImporting all courses to database...');
    await saveCoursesToDatabase();
    
    // Count the courses in database for verification
    const courseCount = await prisma.course.count();
    console.log(`\nVerification: Total courses in database: ${courseCount}`);
    
    console.log('\nCourse import completed successfully!');
  } catch (error) {
    console.error('Error during import process:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main().catch(console.error);