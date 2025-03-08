import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding sample courses for testing...');
  
  // Define the base course type to include all optional fields
  interface CourseData {
    courseCode: string;
    catalogNumber: string;
    title: string;
    description: string;
    units: number;
    prerequisites?: string;
    corequisites?: string;
    antirequisites?: string;
  }
  
  // Sample math/CS courses
  const mathCourses: CourseData[] = [
    { courseCode: 'MATH', catalogNumber: '135', title: 'Algebra for Honours Mathematics', description: 'Introduction to the language of mathematics and proof techniques through a study of the basic algebraic systems of mathematics: the integers, the integers modulo n, the rational numbers, the real numbers, the complex numbers and polynomials.', units: 0.5 },
    { courseCode: 'MATH', catalogNumber: '136', title: 'Linear Algebra 1 for Honours Mathematics', description: 'Systems of linear equations, matrix algebra, elementary matrices, computational issues. Real n-space, vector spaces and subspaces, basis and dimension, rank of a matrix, linear transformations and matrix representations. Determinants, eigenvalues and diagonalization, applications.', units: 0.5 },
    { courseCode: 'MATH', catalogNumber: '137', title: 'Calculus 1 for Honours Mathematics', description: 'Absolute values and inequalities. Sequences and their limits. Introduction to series. Limits of functions and continuity. The Intermediate Value theorem and approximate solutions to equations. Derivatives, rules of differentiation and implicit differentiation. Related rates. The Mean Value theorem. Graph sketching and applications of derivatives. Introduction to integration, Riemann sums, the Fundamental Theorem of Calculus, substitution.', units: 0.5 },
    { courseCode: 'MATH', catalogNumber: '138', title: 'Calculus 2 for Honours Mathematics', description: 'Introduction to the Maple computer algebra system. Methods of integration. Multivariable calculus: partial derivatives, midpoint and linear approximations, the gradient, optimization. Vectors in 2 and 3 dimensions, lines and planes in 3-space. Motion on a curve, tangent, arc length, curvature.', units: 0.5 },
    { courseCode: 'MATH', catalogNumber: '239', title: 'Introduction to Combinatorics', description: 'Introduction to graph theory: colourings, matchings, connectivity, planarity. Introduction to combinatorial analysis: generating series, recurrence relations, binary strings, plane trees.', units: 0.5 },
    
    { courseCode: 'CS', catalogNumber: '135', title: 'Designing Functional Programs', description: 'An introduction to the fundamentals of computer science through the application of elementary programming patterns in the functional style of programming. The patterns are designed to allow computer scientists to engineer large-scale software systems. They will be explored in the context of interactive World-Wide-Web pages, simple computer games, and applications in science, engineering, and business.', units: 0.5 },
    { courseCode: 'CS', catalogNumber: '136', title: 'Elementary Algorithm Design and Data Abstraction', description: 'This course builds on the techniques and patterns learned in CS 135 while making the transition to use of an imperative language. It introduces the design and analysis of algorithms, the management of information, and the programming mechanisms and methodologies required in implementations. Topics include iterative and recursive sorting algorithms; lists, stacks, queues, trees, and their application; abstract data types and their implementations.', units: 0.5, prerequisites: 'CS 135' },
    { courseCode: 'CS', catalogNumber: '245', title: 'Logic and Computation', description: 'Propositional and predicate logic. Soundness and completeness and their implications. Unprovability and undecidability. Proof techniques. Social implications.', units: 0.5, prerequisites: 'CS 136; MATH 135 or 145' },
    { courseCode: 'CS', catalogNumber: '246', title: 'Object-Oriented Software Development', description: 'Introduction to object-oriented programming and design through the study of program structure and organization. Focuses on the concept of data abstraction to hide implementation details from clients of code and the encapsulation of data and procedural components within a single software entity. Additional topics include the interaction of program components through defined interfaces, class libraries, and inheritance. C++ is used as an example of an object-oriented language.', units: 0.5, prerequisites: 'CS 138 or 146' },
    { courseCode: 'CS', catalogNumber: '341', title: 'Algorithms', description: 'The study of efficient algorithms and effective algorithm design techniques. Program design with emphasis on pragmatic and mathematical aspects of program efficiency. Topics include divide and conquer algorithms, recurrences, greedy algorithms, dynamic programming, graph search and backtrack, problems without algorithms, NP-completeness and its implications.', units: 0.5, prerequisites: 'CS 240; CS 341; one of STAT 230, 240' },
    
    { courseCode: 'STAT', catalogNumber: '230', title: 'Probability', description: 'Introduces probability theory and its applications. The course explores probability models, random variables, special distributions, and expectation. Topics include counting, conditional probability, independence, discrete and continuous univariate and multivariate distributions. Techniques to derive distribution of transformed variables and moments are studied. Examples from applications include quality control, epidemiology, environmental studies, and reliability.', units: 0.5 },
    { courseCode: 'STAT', catalogNumber: '231', title: 'Statistics', description: 'Theoretical aspects and practical techniques of statistics are introduced. Topics covered include descriptive statistics, basic probability theory, discrete and continuous probability models, statistical inference, hypothesis testing, correlation and regression, the analysis of variance, the design of experiments and sample surveys, sampling distributions, and nonparametric methods.', units: 0.5, prerequisites: 'STAT 230 or 240' },
    
    { courseCode: 'PMATH', catalogNumber: '347', title: 'Groups and Rings', description: 'Groups, subgroups, quotient groups. Group actions and applications to counting. Sylow theorems. Rings, ideals, quotient rings. Integral domains and fields. Polynomial rings and applications.', units: 0.5, prerequisites: 'MATH 136 or 146; MATH 135 or 145' },
    { courseCode: 'PMATH', catalogNumber: '348', title: 'Fields and Galois Theory', description: 'Field extensions. Algebraic, transcendental, and finite extensions. Degree of an extension. Rulers and compass constructions. Structure of finite fields. Galois theory. Fundamental Theorem of Galois Theory. Insolvability of the quintic.', units: 0.5, prerequisites: 'PMATH 347' },
    { courseCode: 'PMATH', catalogNumber: '351', title: 'Real Analysis', description: 'Real number system. Metric spaces. Limits of functions. Continuity. Connectedness. Compactness. The Contraction Mapping Principle. Stone-Weierstrass Approximation Theorem. Limits of sequences and series of functions. Uniform convergence. Differentiation in several variables. Implicit and Inverse Function Theorems.', units: 0.5, prerequisites: 'MATH 136 or 146; MATH 138 or 148' },
    
    { courseCode: 'CO', catalogNumber: '250', title: 'Introduction to Optimization', description: 'An introduction to the analysis and solution of optimization problems. Includes linear programming and the simplex method, the theory of linear programming and duality, integer programming, and other computational optimization techniques.', units: 0.5, prerequisites: 'MATH 136 or 146' },
    { courseCode: 'CO', catalogNumber: '342', title: 'Introduction to Graph Theory', description: 'Graphs, digraphs, networks, and trees. Subgraphs, isomorphism, and graph operations. Bipartite graphs, matchings, and assignments. Connectivity, Menger\'s Theorem, and Euler tours. Hamiltonian cycles, tournaments, and colouring. Planarity, the Four Color Theorem, and scheduling.', units: 0.5, prerequisites: 'MATH 239' },
    
    { courseCode: 'ENGL', catalogNumber: '192', title: 'Communication in Mathematics & Computer Science', description: 'This course provides students an understanding of the context, audience, and genres of communication in the mathematical disciplines, and helps them develop skills in presenting technical mathematics and computer science content in informative and persuasive documents, including technical reports, email, and public speaking.', units: 0.5 }
  ];
  
  console.log(`Adding ${mathCourses.length} sample courses...`);
  
  // Add each course to the database
  let addedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const course of mathCourses) {
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
        updatedCount++;
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
        addedCount++;
      }
    } catch (error) {
      console.error(`Error adding course ${course.courseCode} ${course.catalogNumber}:`, error);
      errorCount++;
    }
  }
  
  console.log('\nSample courses added successfully!');
  console.log(`- Added: ${addedCount}`);
  console.log(`- Updated: ${updatedCount}`);
  console.log(`- Errors: ${errorCount}`);
  
  // Count total courses in database
  const courseCount = await prisma.course.count();
  console.log(`\nTotal courses in database: ${courseCount}`);
}

main()
  .catch(error => console.error(error))
  .finally(async () => {
    await prisma.$disconnect();
  });