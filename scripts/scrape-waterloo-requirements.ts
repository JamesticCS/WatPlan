import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Scrape a specific program page from Waterloo's academic calendar
async function scrapeProgram(url: string, programName: string) {
  try {
    console.log(`Scraping ${programName} from ${url}`);
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }
    
    // Fetch the page content
    const response = await axios.get(url);
    const html = response.data;
    
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    // Extract all requirement sections
    const requirements: any[] = [];
    
    // Find the content div that contains the degree requirements
    const contentDiv = $('.content-page');
    
    // Regular requirements section (often has an h2 header)
    const reqHeadings = contentDiv.find('h2, h3').filter((i, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('requirement') || 
             text.includes('degree requirements') || 
             text.includes('program requirements');
    });
    
    reqHeadings.each((i, heading) => {
      const $heading = $(heading);
      const headingText = $heading.text().trim();
      
      // Get the content following this heading until the next heading
      let requirementContent = '';
      let nextEl = $heading.next();
      
      while (nextEl.length > 0 && !['H2', 'H3', 'H4'].includes(nextEl.prop('tagName'))) {
        requirementContent += nextEl.prop('outerHTML');
        nextEl = nextEl.next();
      }
      
      // Extract course requirements from lists
      const courseLists: any[] = [];
      const $content = cheerio.load(requirementContent);
      
      $content('ul, ol').each((j, list) => {
        const courses: any[] = [];
        $content(list).find('li').each((k, item) => {
          const text = $content(item).text().trim();
          
          // Look for course codes in the text (e.g., CS 135, MATH 137)
          const courseMatches = text.match(/([A-Z]{2,})\s+(\d{3}[A-Z]?)/g);
          if (courseMatches) {
            for (const match of courseMatches) {
              const [code, num] = match.split(/\s+/);
              courses.push({ code, num, text });
            }
          } else {
            // If no specific course is mentioned, still capture the requirement
            courses.push({ text });
          }
        });
        
        if (courses.length > 0) {
          courseLists.push({
            items: courses
          });
        }
      });
      
      requirements.push({
        title: headingText,
        content: requirementContent,
        courseLists
      });
    });
    
    // Save the scraped data
    const outputFilePath = path.join(dataDir, `${programName.replace(/\s+/g, '-').toLowerCase()}.json`);
    fs.writeFileSync(
      outputFilePath,
      JSON.stringify({ 
        programName, 
        url, 
        requirements, 
        scrapedAt: new Date().toISOString() 
      }, null, 2)
    );
    
    console.log(`Scraped ${requirements.length} requirement sections`);
    console.log(`Data saved to ${outputFilePath}`);
    
    return { programName, requirementsCount: requirements.length };
  } catch (error) {
    console.error(`Error scraping ${programName}:`, error);
    throw error;
  }
}

// Analyze the scraped requirements and classify them by type
function analyzeRequirements(programName: string) {
  const dataDir = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, `${programName.replace(/\s+/g, '-').toLowerCase()}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`Data file not found for ${programName}`);
    return;
  }
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const { requirements } = data;
  
  // Patterns to identify different requirement types
  const requirementPatterns = [
    { type: 'COURSE_LIST_ALL', pattern: /take all|complete all|must complete|required courses/i },
    { type: 'COURSE_LIST_SUBSET', pattern: /take (\d+) of|complete (\d+) of|choose (\d+)|select (\d+)/i },
    { type: 'LEVEL_RESTRICTED', pattern: /\d00-level|\bat the \d00-level\b/i },
    { type: 'MIN_GRADE', pattern: /minimum grade|at least \d+%/i },
    { type: 'MIN_AVERAGE', pattern: /minimum average|cumulative average/i },
    { type: 'MAX_FAILURES', pattern: /maximum.*failures|no more than.*fail/i }
  ];
  
  const analyzedRequirements = requirements.map((req: any) => {
    const types: string[] = [];
    
    // Check the title and content against patterns
    const textToCheck = req.title + ' ' + req.content;
    
    requirementPatterns.forEach(pattern => {
      if (pattern.pattern.test(textToCheck)) {
        types.push(pattern.type);
      }
    });
    
    // Extract number of courses required if it's a subset requirement
    let coursesRequired = null;
    if (types.includes('COURSE_LIST_SUBSET')) {
      const match = textToCheck.match(/take (\d+) of|complete (\d+) of|choose (\d+)|select (\d+)/i);
      if (match) {
        for (let i = 1; i < match.length; i++) {
          if (match[i]) {
            coursesRequired = parseInt(match[i], 10);
            break;
          }
        }
      }
    }
    
    return {
      title: req.title,
      types: types.length > 0 ? types : ['UNKNOWN'],
      coursesRequired,
      courseCount: req.courseLists.reduce((total: number, list: any) => total + list.items.length, 0)
    };
  });
  
  // Count the types
  const typeCounts: Record<string, number> = {};
  analyzedRequirements.forEach((req: any) => {
    req.types.forEach((type: string) => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
  });
  
  // Save the analyzed data
  const analysisFilePath = path.join(dataDir, `${programName.replace(/\s+/g, '-').toLowerCase()}-analysis.json`);
  fs.writeFileSync(
    analysisFilePath,
    JSON.stringify({ 
      programName, 
      requirementTypes: typeCounts,
      analyzedRequirements,
      analyzedAt: new Date().toISOString() 
    }, null, 2)
  );
  
  console.log(`\nRequirement type analysis for ${programName}:`);
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
  });
  
  console.log(`Analysis saved to ${analysisFilePath}`);
}

async function main() {
  try {
    // Example programs to scrape (you can add more)
    const programs = [
      { 
        name: 'Computer Science', 
        url: 'https://ugradcalendar.uwaterloo.ca/page/MATH-Bachelor-of-Computer-Science-1' 
      },
      { 
        name: 'Pure Mathematics', 
        url: 'https://ugradcalendar.uwaterloo.ca/page/MATH-Pure-Mathematics1' 
      }
    ];
    
    // Scrape one program at a time
    for (const program of programs) {
      await scrapeProgram(program.url, program.name);
      analyzeRequirements(program.name);
      console.log('---------------------------------------------------\n');
    }
    
    console.log('Scraping completed successfully!');
  } catch (error) {
    console.error('Error in scraping process:', error);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });