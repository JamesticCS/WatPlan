/**
 * Script to add more sample courses for testing
 * 
 * Since we're having trouble with the UWFlow API, let's add more comprehensive sample data manually
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding extensive sample courses for testing...');
  
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
  
  // Function to add courses in batches
  async function addCourses(courses: CourseData[]) {
    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    
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
    
    return { addedCount, updatedCount, errorCount };
  }
  
  // CS Courses (more comprehensive)
  const csCourses: CourseData[] = [
    { courseCode: 'CS', catalogNumber: '100', title: 'Introduction to Computing through Applications', description: 'Introduction to computer science through exploration of applications. No programming background required.', units: 0.5 },
    { courseCode: 'CS', catalogNumber: '115', title: 'Introduction to Computer Science 1', description: 'Introduction to functional programming, data abstraction, procedural programming and algorithms.', units: 0.5 },
    { courseCode: 'CS', catalogNumber: '116', title: 'Introduction to Computer Science 2', description: 'A continuation of CS 115. Procedural and object-oriented programming, data structures and algorithms.', units: 0.5, prerequisites: 'CS 115', antirequisites: 'CS 136, 145' },
    { courseCode: 'CS', catalogNumber: '135', title: 'Designing Functional Programs', description: 'An introduction to the fundamentals of computer science through functional programming.', units: 0.5 },
    { courseCode: 'CS', catalogNumber: '136', title: 'Elementary Algorithm Design and Data Abstraction', description: 'This course builds on the techniques and patterns learned in CS 135 while introducing the imperative paradigm.', units: 0.5, prerequisites: 'CS 135', antirequisites: 'CS 116, 145' },
    { courseCode: 'CS', catalogNumber: '145', title: 'Designing Functional Programs (Advanced)', description: 'Advanced version of CS 135 for students with significant prior programming experience.', units: 0.5, antirequisites: 'CS 135' },
    { courseCode: 'CS', catalogNumber: '146', title: 'Elementary Algorithm Design and Data Abstraction (Advanced)', description: 'Advanced version of CS 136. Assumes a high level of mathematical and algorithmic sophistication.', units: 0.5, prerequisites: 'CS 145', antirequisites: 'CS 136' },
    { courseCode: 'CS', catalogNumber: '200', title: 'Concepts of Information', description: 'Fundamentals of databases, information retrieval, and information systems.', units: 0.5, prerequisites: 'CS 136 or 138 or 146' },
    { courseCode: 'CS', catalogNumber: '230', title: 'Computers and Society', description: 'Introduction to social, legal, philosophical, ethical, political, economic and cultural implications of computing.', units: 0.5 },
    { courseCode: 'CS', catalogNumber: '234', title: 'Data Types and Structures', description: 'Introduction to data types and structures, abstract data types, and simple algorithms.', units: 0.5, prerequisites: 'CS 136, 138, or 146' },
    { courseCode: 'CS', catalogNumber: '240', title: 'Data Structures and Data Management', description: 'The design, analysis, and implementation of data structures for application in different domains.', units: 0.5, prerequisites: 'CS 136 or 146; MATH 239 or 249' },
    { courseCode: 'CS', catalogNumber: '241', title: 'Foundations of Sequential Programs', description: 'The relationship between high-level languages and computer architecture. Topics include assembly language, compiler organization, code optimization.', units: 0.5, prerequisites: 'CS 136 or 138 or 146' },
    { courseCode: 'CS', catalogNumber: '245', title: 'Logic and Computation', description: 'Propositional and predicate logic for computer science students.', units: 0.5, prerequisites: 'CS 136 or 146; MATH 135 or 145' },
    { courseCode: 'CS', catalogNumber: '246', title: 'Object-Oriented Software Development', description: 'Introduction to object-oriented programming and development using C++.', units: 0.5, prerequisites: 'CS 138 or 246' },
    { courseCode: 'CS', catalogNumber: '251', title: 'Computer Organization and Design', description: 'Overview of computer organization and performance. Basics of digital logic design and hardware construction.', units: 0.5, prerequisites: 'CS 241' },
    { courseCode: 'CS', catalogNumber: '338', title: 'Computer Applications in Business: Databases', description: 'Database management systems: relational databases, SQL, entity-relationship modeling, database design.', units: 0.5, prerequisites: 'CS 338' },
    { courseCode: 'CS', catalogNumber: '341', title: 'Algorithms', description: 'The study of efficient algorithms and effective algorithm design techniques.', units: 0.5, prerequisites: 'CS 240; MATH 239; One of STAT 230, 240' },
    { courseCode: 'CS', catalogNumber: '343', title: 'Concurrent and Parallel Programming', description: 'Fundamentals of concurrent programming. Process interaction, synchronization, deadlocks, multithreading, multiprocessing.', units: 0.5, prerequisites: 'CS 246, 350' },
    { courseCode: 'CS', catalogNumber: '348', title: 'Introduction to Database Management', description: 'Database models: relational, entity-relationship. Relational query languages: SQL, relational algebra.', units: 0.5, prerequisites: 'CS 246' },
    { courseCode: 'CS', catalogNumber: '349', title: 'User Interfaces', description: 'Practical techniques for designing effective human-computer interfaces.', units: 0.5, prerequisites: 'CS 246' },
    { courseCode: 'CS', catalogNumber: '350', title: 'Operating Systems', description: 'Operating system structure, process and resource management. Concurrency, memory management, file systems, protection mechanisms.', units: 0.5, prerequisites: 'CS 241, 246, 251' },
    { courseCode: 'CS', catalogNumber: '370', title: 'Numerical Computation', description: 'Computer arithmetic, solution of nonlinear equations, interpolation, quadrature, linear systems.', units: 0.5, prerequisites: 'CS 136 or 146; MATH 136 or 146; MATH 138 or 148' },
    { courseCode: 'CS', catalogNumber: '436', title: 'Distributed Computer Systems', description: 'Networks, RPC, distributed file systems, distributed shared memory, distributed object-based systems, distributed synchronization, coordination.', units: 0.5, prerequisites: 'CS 350' },
    { courseCode: 'CS', catalogNumber: '444', title: 'Compiler Construction', description: 'Lexical analysis, parsing techniques, semantic analysis and type checking, intermediate representation, code generation.', units: 0.5, prerequisites: 'CS 241, 251' },
    { courseCode: 'CS', catalogNumber: '446', title: 'Software Design and Architectures', description: 'Software design principles, patterns, frameworks, documentation techniques, software architectures.', units: 0.5, prerequisites: 'CS 246, 2 CS courses at the 3xx level' },
    { courseCode: 'CS', catalogNumber: '451', title: 'Data-Intensive Distributed Computing', description: 'Introduction to distributed algorithms and systems for processing large-scale data.', units: 0.5, prerequisites: 'CS 246, 341, 350' },
    { courseCode: 'CS', catalogNumber: '452', title: 'Real-Time Programming', description: 'Real-time kernels. Program structure, timing, and synchronization. Microprocessor features for real-time programming.', units: 0.5, prerequisites: 'CS 350' },
    { courseCode: 'CS', catalogNumber: '454', title: 'Distributed Systems', description: 'Architecture of distributed systems: client-server, distributed databases, security.', units: 0.5, prerequisites: 'CS 350' },
    { courseCode: 'CS', catalogNumber: '456', title: 'Computer Networks', description: 'Overview of computer networks: network architectures, congestion and flow control, routing, distributed systems.', units: 0.5, prerequisites: 'CS 350 or SE 350' },
    { courseCode: 'CS', catalogNumber: '458', title: 'Computer Security and Privacy', description: 'Introduction to security threats, cryptography, program security, operating system protection, network security.', units: 0.5, prerequisites: 'CS 350 or SE 350' },
    { courseCode: 'CS', catalogNumber: '480', title: 'Introduction to Machine Learning', description: 'Supervised learning methods including linear regression, logistic regression, neural networks, decision trees, and kernel methods.', units: 0.5, prerequisites: 'CS 341 and MATH 239. One of STAT 230, 240, and one of STAT 231, 241' },
    { courseCode: 'CS', catalogNumber: '482', title: 'Computational Techniques in Artificial Intelligence', description: 'Knowledge representation, reasoning, and problem-solving. Expert systems, machine learning.', units: 0.5, prerequisites: 'CS 341' },
    { courseCode: 'CS', catalogNumber: '484', title: 'Computational Vision', description: 'Computer vision: image processing, feature extraction, model-based vision, stereo vision, optical flow, pattern classification.', units: 0.5, prerequisites: 'CS 370, 480' },
    { courseCode: 'CS', catalogNumber: '485', title: 'Statistical and Computational Foundations of Machine Learning', description: 'Machine learning algorithms and their statistical and computational foundations.', units: 0.5, prerequisites: 'CS 480' },
    { courseCode: 'CS', catalogNumber: '486', title: 'Introduction to Artificial Intelligence', description: 'Logic-based knowledge representation, reasoning, search algorithms, game playing, planning.', units: 0.5, prerequisites: 'CS 341' },
    { courseCode: 'CS', catalogNumber: '487', title: 'Introduction to Symbolic Computation', description: 'Computer algebra systems, symbolic computation, algebraic specification, term rewriting.', units: 0.5, prerequisites: 'CS 245, 341' },
    { courseCode: 'CS', catalogNumber: '488', title: 'Introduction to Computer Graphics', description: 'Raster graphics systems, geometric transformations, modeling, hidden-surface elimination, shading, ray tracing.', units: 0.5, prerequisites: 'CS 350; MATH 136 or 146' },
    { courseCode: 'CS', catalogNumber: '490', title: 'Information Systems Management', description: 'Information systems in organizations: strategic planning, project management, requirements analysis.', units: 0.5, prerequisites: 'CS 338 or 348' },
    { courseCode: 'CS', catalogNumber: '492', title: 'The Social Implications of Computing', description: 'Social, legal, philosophical, ethical, political, economic and cultural implications of computing.', units: 0.5 }
  ];
  
  // MATH Courses (more comprehensive)
  const mathCourses: CourseData[] = [
    { courseCode: 'MATH', catalogNumber: '127', title: 'Calculus 1 for the Sciences', description: 'Limits, continuity, differentiation, integration, the Fundamental Theorem of Calculus, applications.', units: 0.5 },
    { courseCode: 'MATH', catalogNumber: '128', title: 'Calculus 2 for the Sciences', description: 'Techniques of integration, applications of integration, polar coordinates, parametric curves, differential equations.', units: 0.5, prerequisites: 'MATH 127, 137, or 147' },
    { courseCode: 'MATH', catalogNumber: '135', title: 'Algebra for Honours Mathematics', description: 'Introduction to mathematical language, proof techniques, basic algebraic systems.', units: 0.5 },
    { courseCode: 'MATH', catalogNumber: '136', title: 'Linear Algebra 1 for Honours Mathematics', description: 'Systems of linear equations, matrix algebra, determinants, vector spaces, linear transformations, eigenvalues.', units: 0.5, prerequisites: 'MATH 135 or 145' },
    { courseCode: 'MATH', catalogNumber: '137', title: 'Calculus 1 for Honours Mathematics', description: 'Limits, continuity, the derivative, differentiation of the elementary functions, L\'Hospital\'s rule, optimization, the mean value theorem.', units: 0.5 },
    { courseCode: 'MATH', catalogNumber: '138', title: 'Calculus 2 for Honours Mathematics', description: 'Riemann sum, definite integral, Fundamental Theorem of Calculus, techniques of integration, improper integrals, sequences, series.', units: 0.5, prerequisites: 'MATH 137 or 147' },
    { courseCode: 'MATH', catalogNumber: '145', title: 'Algebra (Advanced)', description: 'An advanced version of MATH 135, covering the same topics but with more depth and additional material.', units: 0.5, antirequisites: 'MATH 135' },
    { courseCode: 'MATH', catalogNumber: '146', title: 'Linear Algebra 1 (Advanced)', description: 'An advanced version of MATH 136, covering the same topics but with more depth and additional material.', units: 0.5, prerequisites: 'MATH 145 or high standing in MATH 135', antirequisites: 'MATH 136' },
    { courseCode: 'MATH', catalogNumber: '147', title: 'Calculus 1 (Advanced)', description: 'An advanced version of MATH 137, covering the same topics but with more depth and additional material.', units: 0.5, antirequisites: 'MATH 137' },
    { courseCode: 'MATH', catalogNumber: '148', title: 'Calculus 2 (Advanced)', description: 'An advanced version of MATH 138, covering the same topics but with more depth and additional material.', units: 0.5, prerequisites: 'MATH 147 or high standing in MATH 137', antirequisites: 'MATH 138' },
    { courseCode: 'MATH', catalogNumber: '207', title: 'Calculus 3', description: 'Differential calculus of functions of several variables, directional derivative, chain rule, implicit functions, extremal problems.', units: 0.5, prerequisites: 'MATH 128 or 138 or 148' },
    { courseCode: 'MATH', catalogNumber: '212', title: 'Logic and Set Theory', description: 'An introduction to mathematical logic and set theory. Consistency and interpretable theories, Gödel\'s completeness and incompleteness theorems.', units: 0.5, prerequisites: 'MATH 135 or 145' },
    { courseCode: 'MATH', catalogNumber: '225', title: 'Statistical Concepts', description: 'Probability, random variables, expectation, sampling distributions, estimation, hypothesis testing, regression, ANOVA.', units: 0.5, prerequisites: 'MATH 138 or 148' },
    { courseCode: 'MATH', catalogNumber: '235', title: 'Linear Algebra 2 for Honours Mathematics', description: 'Inner product spaces, orthogonality, eigenvalues and eigenvectors, diagonalization, quadratic forms, complex vector spaces.', units: 0.5, prerequisites: 'MATH 136 or 146' },
    { courseCode: 'MATH', catalogNumber: '237', title: 'Calculus 3 for Honours Mathematics', description: 'Differential calculus of functions of several variables, directional derivative, chain rule, implicit functions, extremal problems.', units: 0.5, prerequisites: 'MATH 138 or 148' },
    { courseCode: 'MATH', catalogNumber: '239', title: 'Introduction to Combinatorics', description: 'Counting principles, generating functions, recurrence relations, inclusion-exclusion.', units: 0.5, prerequisites: 'MATH 135 or 145' },
    { courseCode: 'MATH', catalogNumber: '245', title: 'Linear Algebra 2 (Advanced)', description: 'Advanced version of MATH 235.', units: 0.5, prerequisites: 'MATH 146 or high standing in MATH 136', antirequisites: 'MATH 235' },
    { courseCode: 'MATH', catalogNumber: '247', title: 'Calculus 3 (Advanced)', description: 'Advanced version of MATH 237.', units: 0.5, prerequisites: 'MATH 148 or high standing in MATH 138', antirequisites: 'MATH 237' },
    { courseCode: 'MATH', catalogNumber: '249', title: 'Introduction to Combinatorics (Advanced)', description: 'Advanced version of MATH 239.', units: 0.5, prerequisites: 'MATH 145 or high standing in MATH 135', antirequisites: 'MATH 239' }
  ];
  
  // PMATH Courses
  const pmathCourses: CourseData[] = [
    { courseCode: 'PMATH', catalogNumber: '330', title: 'Introduction to Mathematical Logic', description: 'Introduction to mathematical logic and proof theory. First-order logic, incompleteness theorems.', units: 0.5, prerequisites: 'MATH 135 or 145' },
    { courseCode: 'PMATH', catalogNumber: '331', title: 'Applied Real Analysis', description: 'Metric spaces, completeness, fixed points, Fourier series, Arzela-Ascoli theorem, Stone-Weierstrass theorem.', units: 0.5, prerequisites: 'MATH 138 or 148; MATH 235 or 245' },
    { courseCode: 'PMATH', catalogNumber: '332', title: 'Applied Complex Analysis', description: 'Complex numbers, analytic functions, contour integration, residue calculus, conformal mapping, Laplace transforms.', units: 0.5, prerequisites: 'MATH 237 or 247' },
    { courseCode: 'PMATH', catalogNumber: '333', title: 'Introduction to Real Analysis', description: 'The real number system, sequences and series, metric spaces, limits of functions, continuity, connectedness, compactness.', units: 0.5, prerequisites: 'MATH 138 or 148; MATH 235 or 245' },
    { courseCode: 'PMATH', catalogNumber: '334', title: 'Introduction to Complex Analysis', description: 'Complex numbers, analytic functions, contour integration, Cauchy\'s Theorem, Taylor and Laurent series, residues, conformal mappings.', units: 0.5, prerequisites: 'MATH 237 or 247' },
    { courseCode: 'PMATH', catalogNumber: '336', title: 'Introduction to Group Theory', description: 'Group theory: subgroups, quotient groups, homomorphisms, isomorphism theorems, Sylow theorems, applications.', units: 0.5, prerequisites: 'MATH 136 or 146; MATH 135 or 145' },
    { courseCode: 'PMATH', catalogNumber: '340', title: 'Elementary Number Theory', description: 'Divisibility, congruences, the Chinese remainder theorem, quadratic reciprocity, arithmetic functions, continued fractions, Diophantine equations.', units: 0.5, prerequisites: 'MATH 135 or 145' },
    { courseCode: 'PMATH', catalogNumber: '347', title: 'Groups and Rings', description: 'Groups, subgroups, quotient groups, group actions, Sylow theorems, rings, ideals, quotient rings.', units: 0.5, prerequisites: 'MATH 136 or 146; MATH 135 or 145' },
    { courseCode: 'PMATH', catalogNumber: '348', title: 'Fields and Galois Theory', description: 'Field extensions, algebraic, transcendental, and finite extensions. Degree of an extension. Galois theory.', units: 0.5, prerequisites: 'PMATH 347' },
    { courseCode: 'PMATH', catalogNumber: '351', title: 'Real Analysis', description: 'Metric spaces, completeness, contraction mappings, connectedness, compactness. Differentiability in several variables.', units: 0.5, prerequisites: 'MATH 136 or 146; MATH 138 or 148' },
    { courseCode: 'PMATH', catalogNumber: '352', title: 'Complex Analysis', description: 'Complex differentiability, Cauchy-Riemann equations, power series, Cauchy\'s theorem, Morera\'s theorem.', units: 0.5, prerequisites: 'PMATH 351 or AMATH 331' },
    { courseCode: 'PMATH', catalogNumber: '365', title: 'Differential Geometry', description: 'Curves and surfaces in 3-space. Curvature and torsion. First and second fundamental forms. Geodesics.', units: 0.5, prerequisites: 'MATH 235 or 245; MATH 237 or 247' },
    { courseCode: 'PMATH', catalogNumber: '370', title: 'Chaos and Fractals', description: 'Iteration of real functions. Periodic cycles, bifurcations, chaos. Julia and Mandelbrot sets.', units: 0.5, prerequisites: 'MATH 136 or 146; MATH 138 or 148' },
    { courseCode: 'PMATH', catalogNumber: '441', title: 'Algebraic Number Theory', description: 'Number fields, integral bases, units, ideals, unique factorization of ideals, prime decomposition of ideals.', units: 0.5, prerequisites: 'PMATH 347, 348' },
    { courseCode: 'PMATH', catalogNumber: '445', title: 'Representations of Finite Groups', description: 'Group representations, character theory, applications to combinatorics and geometry.', units: 0.5, prerequisites: 'PMATH 347, 348' },
    { courseCode: 'PMATH', catalogNumber: '450', title: 'Lebesgue Integration and Fourier Analysis', description: 'Lebesgue measure and integration, L^p spaces, Fourier series and transforms.', units: 0.5, prerequisites: 'PMATH 351, 352' }
  ];
  
  // STAT Courses
  const statCourses: CourseData[] = [
    { courseCode: 'STAT', catalogNumber: '202', title: 'Statistics for Life Sciences', description: 'Descriptive statistics, probability concepts, distributions, hypothesis testing, confidence intervals, ANOVA, regression.', units: 0.5 },
    { courseCode: 'STAT', catalogNumber: '206', title: 'Statistics for Software Engineering', description: 'Statistical methods applicable to software engineering. Descriptive statistics, probability, confidence intervals, hypothesis testing.', units: 0.5 },
    { courseCode: 'STAT', catalogNumber: '211', title: 'Introduction to Statistics and Data Analysis', description: 'Descriptive statistics, sampling distributions, hypothesis testing, confidence intervals, regression, ANOVA.', units: 0.5 },
    { courseCode: 'STAT', catalogNumber: '230', title: 'Probability', description: 'Introduction to probability theory, random variables, probability distributions, expectation, special distributions.', units: 0.5, prerequisites: 'MATH 138 or 148' },
    { courseCode: 'STAT', catalogNumber: '231', title: 'Statistics', description: 'Statistical inference, point and interval estimation, hypothesis testing, chi-square tests, nonparametric methods, linear regression.', units: 0.5, prerequisites: 'STAT 230 or 240' },
    { courseCode: 'STAT', catalogNumber: '240', title: 'Probability (Advanced)', description: 'An advanced version of STAT 230.', units: 0.5, prerequisites: 'MATH 148 or high standing in MATH 138', antirequisites: 'STAT 230' },
    { courseCode: 'STAT', catalogNumber: '241', title: 'Statistics (Advanced)', description: 'An advanced version of STAT 231.', units: 0.5, prerequisites: 'STAT 240 or high standing in STAT 230', antirequisites: 'STAT 231' },
    { courseCode: 'STAT', catalogNumber: '330', title: 'Mathematical Statistics', description: 'Statistical models, point estimation, properties of estimators, interval estimation, hypothesis testing, likelihood methods.', units: 0.5, prerequisites: 'STAT 231 or 241; MATH 237 or 247' },
    { courseCode: 'STAT', catalogNumber: '331', title: 'Applied Linear Models', description: 'Linear regression, analysis of variance, experimental design, model selection, diagnostics.', units: 0.5, prerequisites: 'STAT 231 or 241; MATH 235 or 245' },
    { courseCode: 'STAT', catalogNumber: '332', title: 'Sampling and Experimental Design', description: 'Sampling schemes, estimation procedures, sample size determination, experimental designs, blocking, multiple comparisons.', units: 0.5, prerequisites: 'STAT 231 or 241' },
    { courseCode: 'STAT', catalogNumber: '333', title: 'Applied Probability', description: 'Generating functions, compound distributions, branching processes, renewal theory, Markov chains, Poisson processes.', units: 0.5, prerequisites: 'STAT 230 or 240; MATH 237 or 247' },
    { courseCode: 'STAT', catalogNumber: '334', title: 'Probability Theory for Finance', description: 'Probability theory with applications to mathematical finance. Brownian motion, stochastic calculus, option pricing.', units: 0.5, prerequisites: 'STAT 230 or 240; MATH 237 or 247' },
    { courseCode: 'STAT', catalogNumber: '340', title: 'Computer Simulation of Complex Systems', description: 'Discrete event simulation, random number generation, Monte Carlo methods, variance reduction, output analysis.', units: 0.5, prerequisites: 'STAT 231 or 241' },
    { courseCode: 'STAT', catalogNumber: '371', title: 'Applied Regression Analysis', description: 'Simple and multiple linear regression, model selection, diagnostics, transformations, analysis of variance.', units: 0.5, prerequisites: 'STAT 371', antirequisites: 'STAT 331' },
    { courseCode: 'STAT', catalogNumber: '431', title: 'Generalized Linear Models and Analysis of Categorical Data', description: 'Generalized linear models, contingency tables, logistic regression, log-linear models, multinomial response models.', units: 0.5, prerequisites: 'STAT 331 or 371' },
    { courseCode: 'STAT', catalogNumber: '440', title: 'Computational Inference', description: 'Computational methods for statistical inference. Monte Carlo methods, bootstrap, EM algorithm, MCMC.', units: 0.5, prerequisites: 'STAT 330, 331, 340' },
    { courseCode: 'STAT', catalogNumber: '441', title: 'Statistical Learning - Classification', description: 'Classification methods: logistic regression, LDA, trees, neural networks, SVM, ensemble methods.', units: 0.5, prerequisites: 'STAT 330, 331' },
    { courseCode: 'STAT', catalogNumber: '442', title: 'Data Visualization', description: 'Principles of effective data visualization. Graphical perception, exploratory data analysis, statistical graphics.', units: 0.5, prerequisites: 'STAT 330, 331' },
    { courseCode: 'STAT', catalogNumber: '443', title: 'Forecasting', description: 'Time series analysis, ARIMA models, exponential smoothing, state space models, forecast evaluation.', units: 0.5, prerequisites: 'STAT 331 or 371' },
    { courseCode: 'STAT', catalogNumber: '444', title: 'Statistical Learning - Function Estimation', description: 'Nonparametric regression, smoothing methods, model selection, additive models, basis expansions.', units: 0.5, prerequisites: 'STAT 330, 331' }
  ];
  
  // General education courses
  const genEdCourses: CourseData[] = [
    { courseCode: 'ENGL', catalogNumber: '109', title: 'Introduction to Academic Writing', description: 'Examination and practice of strategies for effective academic communication with an emphasis on argumentation.', units: 0.5 },
    { courseCode: 'ENGL', catalogNumber: '192', title: 'Communication in Mathematics & Computer Science', description: 'Written and oral communication focused on mathematics and computer science. Common forms of communication in these fields.', units: 0.5 },
    { courseCode: 'ENGL', catalogNumber: '210F', title: 'Genres of Creative Writing', description: 'Introduction to the principles of creative writing, focusing on various genres such as poetry, fiction, and creative nonfiction.', units: 0.5 },
    { courseCode: 'PHIL', catalogNumber: '145', title: 'Critical Thinking', description: 'An introduction to the identification, analysis, and evaluation of arguments.', units: 0.5 },
    { courseCode: 'PHIL', catalogNumber: '200J', title: 'Philosophy and the Mathematical Sciences', description: 'An investigation of philosophical issues in mathematics and statistics.', units: 0.5 },
    { courseCode: 'PHIL', catalogNumber: '256', title: 'Introduction to Cognitive Science', description: 'A philosophical and scientific exploration of the nature of the mind.', units: 0.5 },
    { courseCode: 'STV', catalogNumber: '202', title: 'Design and Society', description: 'A study of how design affects society, culture, and the environment.', units: 0.5 },
    { courseCode: 'STV', catalogNumber: '205', title: 'Cybernetics and Society', description: 'An examination of the social implications of cybernetics, computing, and artificial intelligence.', units: 0.5 },
    { courseCode: 'ECON', catalogNumber: '101', title: 'Introduction to Microeconomics', description: 'An introduction to microeconomic analysis relevant for understanding the Canadian economy.', units: 0.5 },
    { courseCode: 'ECON', catalogNumber: '102', title: 'Introduction to Macroeconomics', description: 'An introduction to macroeconomic analysis relevant for understanding the Canadian economy.', units: 0.5 },
    { courseCode: 'BUS', catalogNumber: '111W', title: 'Introduction to Business Organization', description: 'Introduction to the functional areas of business and their interrelationships.', units: 0.5 },
    { courseCode: 'BUS', catalogNumber: '121W', title: 'Functional Areas of Business', description: 'Extended study of major functional areas of business: marketing, operations, accounting, finance, and human resources.', units: 0.5 },
    { courseCode: 'PSYCH', catalogNumber: '101', title: 'Introductory Psychology', description: 'Introduction to the scientific study of behavior and mind.', units: 0.5 },
    { courseCode: 'PSYCH', catalogNumber: '230', title: 'Cognitive Psychology', description: 'The scientific study of cognitive processes: perception, attention, memory, problem-solving, decision-making.', units: 0.5, prerequisites: 'PSYCH 101' },
    { courseCode: 'SPCOM', catalogNumber: '100', title: 'Interpersonal Communication', description: 'Introduction to interpersonal communication theory and practice.', units: 0.5 },
    { courseCode: 'SPCOM', catalogNumber: '223', title: 'Public Speaking', description: 'Theory and practice of public speaking.', units: 0.5 }
  ];
  
  // Engineering courses for Computer Engineering and Software Engineering
  const engCourses: CourseData[] = [
    { courseCode: 'ECE', catalogNumber: '105', title: 'Introduction to Electrical and Computer Engineering', description: 'An introduction to the fundamentals of electrical and computer engineering.', units: 0.5 },
    { courseCode: 'ECE', catalogNumber: '106', title: 'Electricity and Magnetism', description: 'Electrostatics, magnetostatics, electric and magnetic fields, DC and AC circuits.', units: 0.5 },
    { courseCode: 'ECE', catalogNumber: '140', title: 'Linear Circuits', description: 'Circuit elements, Kirchhoff\'s laws, node and mesh analysis, Thévenin and Norton theorems.', units: 0.5 },
    { courseCode: 'ECE', catalogNumber: '150', title: 'Fundamentals of Programming', description: 'Introduction to programming using C++.', units: 0.5 },
    { courseCode: 'ECE', catalogNumber: '222', title: 'Digital Computers', description: 'Number systems, Boolean algebra, combinational and sequential circuits, hardware description languages.', units: 0.5 },
    { courseCode: 'ECE', catalogNumber: '250', title: 'Algorithms and Data Structures', description: 'Algorithm analysis, recursion, sorting, searching, trees, graphs, dynamic programming.', units: 0.5, prerequisites: 'ECE 150' },
    { courseCode: 'ECE', catalogNumber: '254', title: 'Operating Systems and Systems Programming', description: 'Operating system structure, processes, threads, synchronization, scheduling, memory management, file systems.', units: 0.5, prerequisites: 'ECE 250' },
    { courseCode: 'ECE', catalogNumber: '350', title: 'Real-Time Operating Systems', description: 'Real-time operating systems, scheduling, resource management, synchronization, inter-process communication.', units: 0.5, prerequisites: 'ECE 254' },
    { courseCode: 'ECE', catalogNumber: '351', title: 'Compilers', description: 'Lexical analysis, parsing, syntax-directed translation, code generation, code optimization.', units: 0.5, prerequisites: 'ECE 250' },
    { courseCode: 'ECE', catalogNumber: '356', title: 'Database Systems', description: 'Database design, entity-relationship model, relational model, SQL, normalization, query processing.', units: 0.5, prerequisites: 'ECE 250' },
    { courseCode: 'ECE', catalogNumber: '457A', title: 'Cooperative and Adaptive Algorithms', description: 'Introduction to cooperative and adaptive systems. Neural networks, evolutionary computation.', units: 0.5, prerequisites: 'ECE 250' },
    { courseCode: 'ECE', catalogNumber: '457B', title: 'Fundamentals of Computational Intelligence', description: 'Neural networks, fuzzy systems, evolutionary computation, swarm intelligence.', units: 0.5, prerequisites: 'ECE 250' },
    { courseCode: 'ECE', catalogNumber: '458', title: 'Computer Security', description: 'Computer security concepts, cryptography, authentication, access control, network security.', units: 0.5, prerequisites: 'ECE 254' },
    { courseCode: 'SE', catalogNumber: '101', title: 'Introduction to Methods of Software Engineering', description: 'Introduction to the phases of software development: requirements, design, implementation, testing, maintenance.', units: 0.5 },
    { courseCode: 'SE', catalogNumber: '212', title: 'Logic and Computation', description: 'Propositional and predicate logic, proof techniques, induction, formal methods.', units: 0.5 },
    { courseCode: 'SE', catalogNumber: '350', title: 'Operating Systems', description: 'Process management, scheduling, memory management, file systems, input/output, virtualization.', units: 0.5 },
    { courseCode: 'SE', catalogNumber: '463', title: 'Software Requirements Specification and Analysis', description: 'Requirements elicitation, specification, validation, management.', units: 0.5 },
    { courseCode: 'SE', catalogNumber: '464', title: 'Software Design and Architectures', description: 'Software design principles, patterns, architectural styles, design notations.', units: 0.5 },
    { courseCode: 'SE', catalogNumber: '465', title: 'Software Testing and Quality Assurance', description: 'Test case design, black box and white box testing, regression testing, static analysis.', units: 0.5 }
  ];
  
  // Add all course batches
  console.log(`Adding ${csCourses.length} CS courses...`);
  const csResults = await addCourses(csCourses);
  
  console.log(`\nAdding ${mathCourses.length} MATH courses...`);
  const mathResults = await addCourses(mathCourses);
  
  console.log(`\nAdding ${pmathCourses.length} PMATH courses...`);
  const pmathResults = await addCourses(pmathCourses);
  
  console.log(`\nAdding ${statCourses.length} STAT courses...`);
  const statResults = await addCourses(statCourses);
  
  console.log(`\nAdding ${genEdCourses.length} general education courses...`);
  const genEdResults = await addCourses(genEdCourses);
  
  console.log(`\nAdding ${engCourses.length} engineering courses...`);
  const engResults = await addCourses(engCourses);
  
  // Calculate totals
  const totalAdded = 
    csResults.addedCount + 
    mathResults.addedCount + 
    pmathResults.addedCount + 
    statResults.addedCount + 
    genEdResults.addedCount + 
    engResults.addedCount;
    
  const totalUpdated = 
    csResults.updatedCount + 
    mathResults.updatedCount + 
    pmathResults.updatedCount + 
    statResults.updatedCount + 
    genEdResults.updatedCount + 
    engResults.updatedCount;
    
  const totalErrors = 
    csResults.errorCount + 
    mathResults.errorCount + 
    pmathResults.errorCount + 
    statResults.errorCount + 
    genEdResults.errorCount + 
    engResults.errorCount;
  
  // Print final summary
  console.log('\nSample courses added successfully!');
  console.log(`- Added: ${totalAdded}`);
  console.log(`- Updated: ${totalUpdated}`);
  console.log(`- Errors: ${totalErrors}`);
  
  // Count total courses in database
  const courseCount = await prisma.course.count();
  console.log(`\nTotal courses in database: ${courseCount}`);
}

main()
  .catch(error => console.error(error))
  .finally(async () => {
    await prisma.$disconnect();
  });