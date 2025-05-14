import * as fs from 'fs';
import * as path from 'path';

// Load the UWFlow course data
const dataFile = path.join(process.cwd(), 'data', 'uwflow', 'all_courses.json');
const courses = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log(`Total courses in UWFlow data: ${courses.length}`);

// Extract subject codes and count unique ones
const subjectCodes = courses.map(course => {
  const parts = course.code.split(' ');
  return parts[0].toUpperCase();
});

const uniqueSubjects = [...new Set(subjectCodes)].sort();
console.log(`\nTotal unique subject codes: ${uniqueSubjects.length}`);
console.log(`\nAll subject codes: ${uniqueSubjects.join(', ')}`);

// Count courses per subject
const subjectCounts = {};
subjectCodes.forEach(code => {
  subjectCounts[code] = (subjectCounts[code] || 0) + 1;
});

// Sort subject counts by count (descending)
const sortedSubjects = Object.entries(subjectCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([subject, count]) => ({ subject, count }));

console.log('\nTop 20 subjects by course count:');
console.log(sortedSubjects.slice(0, 20));

// Check for specific subject
function checkSubject(code) {
  const matchingCourses = courses.filter(course => course.code.toUpperCase().startsWith(code.toUpperCase() + ' '));
  console.log(`\nCourses for ${code}: ${matchingCourses.length}`);
  
  if (matchingCourses.length > 0) {
    console.log('Sample courses:');
    matchingCourses.slice(0, 5).forEach(course => {
      console.log(`- ${course.code}: ${course.name}`);
    });
  }
}

// Check for STAT and ECON courses as examples
checkSubject('STAT');
checkSubject('ECON');
checkSubject('MATH');