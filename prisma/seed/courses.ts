import { PrismaClient } from '@prisma/client';

export async function seedCourses(prisma: PrismaClient) {
  console.log('Seeding courses...');
  
  const courses = [
    // PMATH courses
    {
      courseCode: 'PMATH',
      catalogNumber: '347',
      title: 'Groups and Rings',
      description: 'Groups, subgroups, homomorphisms and quotient groups, isomorphism theorems, group actions, Cayley and Lagrange theorems, permutation groups and the fundamental theorem of finite abelian groups. Elementary properties of rings, subrings, ideals, homomorphisms and quotients, isomorphism theorems, polynomial rings, and unique factorization domains.',
      units: 0.5,
      prerequisites: 'MATH 235 or 245',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PMATH',
      catalogNumber: '348',
      title: 'Fields and Galois Theory',
      description: 'Fields, algebraic and transcendental extensions, minimal polynomials, Eisenstein\'s criterion, splitting fields, and the structure of finite fields. Sylow theorems and solvable groups. Galois theory. The insolvability of the quintic.',
      units: 0.5,
      prerequisites: 'PMATH 347',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PMATH',
      catalogNumber: '351',
      title: 'Real Analysis',
      description: 'Normed and metric spaces, open sets, continuous mappings, sequence and function spaces, completeness, contraction mappings, compactness of metric spaces, finite-dimensional normed spaces, Arzela-Ascoli theorem, existence of solutions of differential equations, Stone-Weierstrass theorem.',
      units: 0.5,
      prerequisites: 'MATH 247 or PMATH 333',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PMATH',
      catalogNumber: '352',
      title: 'Complex Analysis',
      description: 'Analytic functions, Cauchy-Riemann equations, Goursat\'s theorem, Cauchy\'s theorems, Morera\'s theorem, Liouville\'s theorem, maximum modulus principle, harmonic functions, Schwarz\'s lemma, isolated singularities, Laurent series, residue theorem.',
      units: 0.5,
      prerequisites: 'MATH 247 or PMATH 333',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PMATH',
      catalogNumber: '450',
      title: 'Lebesgue Integration and Fourier Analysis',
      description: 'Lebesgue measure on the line, the Lebesgue integral, monotone and dominated convergence theorems, Lp-spaces: completeness and dense subspaces. Separable Hilbert space, orthonormal bases. Fourier analysis on the circle, Dirichlet kernel, Riemann-Lebesgue lemma, Fejer\'s theorem, and convergence of Fourier series.',
      units: 0.5,
      prerequisites: 'PMATH 351 with a grade of at least of 60%',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PMATH',
      catalogNumber: '331',
      title: 'Applied Real Analysis',
      description: 'Topology of Euclidean spaces, continuity, norms, completeness. Contraction mapping principle. Fourier series. Various applications, for example, to ordinary differential equations, optimization and numerical approximation.',
      units: 0.5,
      prerequisites: 'MATH 237 or 247',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PMATH',
      catalogNumber: '332',
      title: 'Applied Complex Analysis',
      description: 'Complex numbers, Cauchy-Riemann equations, analytic functions, conformal maps and applications to the solution of Laplace\'s equation, contour integrals, Cauchy integral formula, Taylor and Laurent expansions, residue calculus and applications.',
      units: 0.5,
      prerequisites: 'MATH 237 or 247',
      corequisites: null,
      antirequisites: 'PHYS 365'
    },
    
    // STAT courses
    {
      courseCode: 'STAT',
      catalogNumber: '231',
      title: 'Statistics',
      description: 'Graphical and numerical summaries, statistical inference, probability, random variables, point and interval estimates, contingency tables and goodness-of-fit, analysis of variance, applications to scientific, engineering and business problems.',
      units: 0.5,
      prerequisites: 'MATH 128 or 138 or 148',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'STAT',
      catalogNumber: '330',
      title: 'Mathematical Statistics',
      description: 'Point and interval estimation, hypothesis testing, distribution-free methods, goodness of fit, and analysis of variance.',
      units: 0.5,
      prerequisites: 'STAT 230 or 240; MATH 128 or 138 or 148',
      corequisites: null,
      antirequisites: null
    },
    
    // CO courses
    {
      courseCode: 'CO',
      catalogNumber: '250',
      title: 'Introduction to Optimization',
      description: 'Introduction to the study of optimization problems including linear programming, and basic algorithms for network problems. Examples of optimization in business and engineering.',
      units: 0.5,
      prerequisites: 'MATH 136 or 146; Not open to Computer Science students',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'CO',
      catalogNumber: '342',
      title: 'Introduction to Graph Theory',
      description: 'Introduction to graph theory including connectivity, trees, paths, matchings, and graph colouring.',
      units: 0.5,
      prerequisites: 'MATH 239',
      corequisites: null,
      antirequisites: null
    },
    
    // AMATH courses
    {
      courseCode: 'AMATH',
      catalogNumber: '231',
      title: 'Calculus 4',
      description: 'Curve tracing in different coordinate systems. Line and surface integrals. Theorems of Green, Gauss and Stokes. Introduction to boundary value problems.',
      units: 0.5,
      prerequisites: 'MATH 237 or 247',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'AMATH',
      catalogNumber: '250',
      title: 'Introduction to Differential Equations',
      description: 'First order linear and non-linear equations, linear independence of solutions, methods of undetermined coefficients, variation of parameters, Wronskian, power series solutions. Systems of equations, matrix methods for linear systems with constant coefficients, eigenvalues and eigenvectors.',
      units: 0.5,
      prerequisites: 'MATH 136/146 and 138/148',
      corequisites: null,
      antirequisites: null
    },
    
    // STV courses
    {
      courseCode: 'STV',
      catalogNumber: '202',
      title: 'Design and Society',
      description: 'An examination of how design both reflects and shapes our society. This course will critically analyze how environmental, political, economic, and cultural issues are influenced by designed products and services.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'STV',
      catalogNumber: '205',
      title: 'Cybernetics and Society',
      description: 'Introduction to the humanistic and social scientific analysis of new technologies, focusing on artificial intelligence, robots, algorithms, and their effects on society.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    
    // PHIL courses
    {
      courseCode: 'PHIL',
      catalogNumber: '145',
      title: 'Critical Thinking',
      description: 'An introduction to the identification, analysis, evaluation, and construction of arguments in ordinary language.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PHIL',
      catalogNumber: '256',
      title: 'Introduction to Cognitive Science',
      description: 'An introduction to the scientific study of mind and cognition from perspectives of philosophy, linguistics, psychology, computer science, and neuroscience.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    
    // BUS courses
    {
      courseCode: 'BUS',
      catalogNumber: '111W',
      title: 'Introduction to Business Organization',
      description: 'An introduction to the structure and functions of business from a managerial perspective. Includes the Canadian business environment, forms of organization, management functions, and financial management.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'BUS',
      catalogNumber: '121W',
      title: 'Functional Areas of Business',
      description: 'An introduction to the core functional areas of business and how they interrelate, including marketing, operations, finance, human resources, and organizational behavior.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    
    // ECON courses
    {
      courseCode: 'ECON',
      catalogNumber: '101',
      title: 'Introduction to Microeconomics',
      description: 'An introduction to microeconomic analysis relevant for understanding the Canadian economy. The behaviour of individual consumers and producers, the determination of market prices for commodities and factor inputs, and the role of government in the functioning of the market system.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    // MATH courses
    {
      courseCode: 'MATH',
      catalogNumber: '52',
      title: 'Pre-University Calculus',
      description: 'The concepts included are limits, derivatives, antiderivatives and definite integrals. These concepts will be applied to solve problems of rates of change, maximum and minimum, curve sketching and areas. The classes of functions used to develop these concepts and applications are: polynomial, rational, trigonometric, exponential, and logarithmic.',
      units: 0.0,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'MATH',
      catalogNumber: '97',
      title: 'Study Abroad',
      description: 'For studies at other universities under approved exchange agreements.',
      units: 2.5,
      prerequisites: 'Department Consent Required',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'MATH',
      catalogNumber: '103',
      title: 'Introductory Algebra for Arts and Social Science',
      description: 'An introduction to applications of algebra to business, the behavioural sciences, and the social sciences. Topics will be chosen from linear equations, systems of linear equations, linear inequalities, functions, set theory, permutations and combinations, binomial theorem, probability theory.',
      units: 0.5,
      prerequisites: 'Open only to students in the following faculties: ARTS, AHS or ENV. Not open to Acc\'ting & Fin Mgt students.',
      corequisites: null,
      antirequisites: 'MATH 106, 114, 115, 136, 146, NE 112'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '104',
      title: 'Introductory Calculus for Arts and Social Science',
      description: 'An introduction to applications of calculus in business, the behavioural sciences, and the social sciences. The models studied will involve polynomial, rational, exponential, and logarithmic functions. The major concepts introduced to solve problems are rate of change, optimization, growth and decay, and integration.',
      units: 0.5,
      prerequisites: 'Open only to students in the following Faculties: ARTS, AHS, ENV, SCI.',
      corequisites: null,
      antirequisites: 'MATH 127, 137, 147'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '106',
      title: 'Applied Linear Algebra 1',
      description: 'Systems of linear equations. Matrix algebra. Determinants. Introduction to vector spaces. Applications.',
      units: 0.5,
      prerequisites: 'MATH 103 or 4U Calculus and Vectors; Not open to Computer Science students.',
      corequisites: null,
      antirequisites: 'MATH 114, 115, 136, 146, NE 112'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '114',
      title: 'Linear Algebra for Science',
      description: 'Vectors in 2- and 3-space and their geometry. Linear equations, matrices, and determinants. Introduction to vector spaces. Eigenvalues and diagonalization. Applications. Complex numbers.',
      units: 0.5,
      prerequisites: '4U Calculus and Vectors; Science or Geomatics students only.',
      corequisites: null,
      antirequisites: 'MATH 106, 115, 136, 146, NE 112'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '115',
      title: 'Linear Algebra for Engineering',
      description: 'Linear equations, matrices and determinants. Introduction to vector spaces. Eigenvalues and diagonalization. Applications. Complex numbers.',
      units: 0.5,
      prerequisites: '4U Calculus and Vectors or 4U Mathematics of Data Management; Engineering students only.',
      corequisites: null,
      antirequisites: 'MATH 106, 114, 136, 146, NE 112'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '116',
      title: 'Calculus 1 for Engineering',
      description: 'Functions: review of polynomials, exponential, logarithmic, trigonometric. Operations on functions, curve sketching. Trigonometric identities, inverse functions. Derivatives, rules of differentiation. Mean Value Theorem, Newton\'s Method. Indeterminate forms and L\'Hopital\'s rule, applications. Integrals, approximations, Riemann definite integral, Fundamental Theorems. Applications of the integral.',
      units: 0.5,
      prerequisites: '4U Calculus and Vectors; Open to students in Engineering excluding Electrical and Computer Eng, Nanotechnology Eng, Software Eng and Systems Design Eng.',
      corequisites: null,
      antirequisites: 'MATH 117, 124, 127, 137, 147'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '117',
      title: 'Calculus 1 for Engineering',
      description: 'Functions of engineering importance; review of polynomial, exponential, and logarithmic functions; trigonometric functions and identities. Inverse functions (logarithmic and trigonometric). Limits and continuity. Derivatives, rules of differentiation; derivatives of elementary functions. Applications of the derivative, max-min problems, Mean Value Theorem. Antiderivatives, the Riemann definite integral, Fundamental Theorems. Methods of integration, approximation, applications, improper integrals.',
      units: 0.5,
      prerequisites: '4U Calculus and Vectors; Open only to students in Electrical and Computer Engineering or Software Engineering or Nanotechnology Engineering.',
      corequisites: null,
      antirequisites: 'MATH 116, 124, 127, 137, 147'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '118',
      title: 'Calculus 2 for Engineering',
      description: 'Methods of integration: by parts, trigonometric substitutions, partial fractions; engineering applications, approximation of integrals, improper integrals. Linear and separable first order differential equations, applications. Parametric curves and polar coordinates, arc length and area. Infinite sequences and series, convergence tests, power series and applications. Taylor polynomials and series, Taylor\'s Remainder Theorem, applications.',
      units: 0.5,
      prerequisites: 'One of MATH 116, 117, 127, 137, 147; Open only to students in Engineering excluding students in Electrical and Computer Eng, Nanotechnology Eng, Software Eng and Systems Design Eng.',
      corequisites: null,
      antirequisites: 'MATH 119, 128, 138, 148'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '119',
      title: 'Calculus 2 for Engineering',
      description: 'Elementary approximation methods: interpolation; Taylor polynomials and remainder; Newton\'s method, Landau order symbol, applications. Infinite series: Taylor series and Taylor\'s Remainder Theorem, geometric series, convergence test, power series, applications. Functions of several variables: partial derivatives, linear approximation and differential, gradient and directional derivative, optimization and Lagrange multipliers. Vector-valued functions: parametric representation of curves, tangent and normal vectors, line integrals and applications.',
      units: 0.5,
      prerequisites: 'One of MATH 116, 117, 127, 137, 147; Open only to students in Electrical and Computer Engineering or Software Engineering or Nanotechnology Engineering.',
      corequisites: null,
      antirequisites: 'MATH 118, 128, 138, 148'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '124',
      title: 'Calculus and Vector Algebra for Kinesiology',
      description: 'Review of trigonometry and basic algebra. Introduction to vectors in 2- and 3-space: sums, addition, dot products, cross products and angles between vectors. Solving linear systems in two and three variables. Functions of a real variable: powers, rational functions, trigonometric, exponential and logarithmic functions, their properties. Intuitive discussion of limits and continuity. Derivatives of elementary functions, derivative rules; applications to curve sketching, optimization. Relationships between distance, velocity, and acceleration. The definite integral, antiderivatives, the Fundamental Theorem of Calculus; change of variable and integration by parts; applications to area, centre of mass.',
      units: 0.5,
      prerequisites: '4U Advanced Functions; Kinesiology students only.',
      corequisites: null,
      antirequisites: 'MATH 109, 116, 117, 127, 137, 147'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '127',
      title: 'Calculus 1 for the Sciences',
      description: 'Functions of a real variable: powers, rational functions, trigonometric, exponential and logarithmic functions, their properties and inverses. Intuitive discussion of limits and continuity. Definition and interpretation of the derivative, derivatives of elementary functions, derivative rules and applications. Riemann sums and other approximations to the definite integral. Fundamental theorems and antiderivatives; change of variable. Applications to area, rates, average value.',
      units: 0.5,
      prerequisites: 'MATH 104 or 4U Calculus and Vectors.',
      corequisites: null,
      antirequisites: 'MATH 109, 116, 117, 124, 137, 147'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '128',
      title: 'Calculus 2 for the Sciences',
      description: 'Transforming and evaluating integrals; application to volumes and arc length; improper integrals. Separable and linear first order differential equations and applications. Introduction to sequences. Convergence of series; Taylor polynomials, Taylor\'s Remainder theorem, Taylor series and applications. Parametric/vector representation of curves; particle motion and arc length. Polar coordinates in the plane.',
      units: 0.5,
      prerequisites: 'One of MATH 116, 117, 127, 137, 147.',
      corequisites: null,
      antirequisites: 'MATH 118, 119, 138, 148'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '135',
      title: 'Algebra for Honours Mathematics',
      description: 'An introduction to the language of mathematics and proof techniques through a study of the basic algebraic systems of mathematics: the integers, the integers modulo n, the rational numbers, the real numbers, the complex numbers and polynomials.',
      units: 0.5,
      prerequisites: '4U Calculus and Vectors or 4U Mathematics of Data Management; Honours Mathematics or Mathematics/BASE or Software Engineering students only.',
      corequisites: null,
      antirequisites: 'MATH 145'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '136',
      title: 'Linear Algebra 1 for Honours Mathematics',
      description: 'Systems of linear equations, matrix algebra, elementary matrices, computational issues. Real n-space, vector spaces and subspaces, basis and dimension, rank of a matrix, linear transformations, and matrix representations. Determinants, eigenvalues and diagonalization, applications.',
      units: 0.5,
      prerequisites: '(MATH 135 with a grade of at least 60% or MATH 145; Honours Mathematics or Mathematics/BASE students) or Science Mathematical Physics students.',
      corequisites: null,
      antirequisites: 'MATH 106, 114, 115, 146, NE 112'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '137',
      title: 'Calculus 1 for Honours Mathematics',
      description: 'Absolute values and inequalities. Sequences and their limits. Introduction to series. Limits of functions and continuity. The Intermediate Value theorem and approximate solutions to equations. Derivatives, linear approximation, and Newton\'s method. The Mean Value theorem and error bounds. Applications of the Mean Value theorem, Taylor polynomials and Taylor\'s theorem, Big-O notation. Suitable topics are illustrated using computer software.',
      units: 0.5,
      prerequisites: '4U Calculus and Vectors.',
      corequisites: null,
      antirequisites: 'MATH 116, 117, 127, 147'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '138',
      title: 'Calculus 2 for Honours Mathematics',
      description: 'Introduction to the Riemann integral and approximations. Antiderivatives and the fundamental theorem of calculus. Change of variables, methods of integration. Applications of the integral. Improper integrals. Linear and separable differential equations and applications. Tests for convergence for series. Binomial series, functions defined as power series and Taylor series. Vector (parametric) curves in R2. Suitable topics are illustrated using computer software.',
      units: 0.5,
      prerequisites: '(MATH 116 or 117 or 127 with a grade of at least 70%) or MATH 137 with a grade of at least 60% or MATH 147.',
      corequisites: null,
      antirequisites: 'MATH 118, 119, 128, 148'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '145',
      title: 'Algebra (Advanced Level)',
      description: 'MATH 145 is an advanced-level version of MATH 135.',
      units: 0.5,
      prerequisites: '4U Calculus and Vectors or 4U Mathematics of Data Management; Honours Mathematics students only.',
      corequisites: null,
      antirequisites: 'MATH 135'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '146',
      title: 'Linear Algebra 1 (Advanced Level)',
      description: 'MATH 146 is an advanced-level version of MATH 136.',
      units: 0.5,
      prerequisites: 'MATH 145; Honours Mathematics students only.',
      corequisites: null,
      antirequisites: 'MATH 106, 114, 115, 136, NE 112'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '147',
      title: 'Calculus 1 (Advanced Level)',
      description: 'MATH 147 is an advanced-level version of MATH 137.',
      units: 0.5,
      prerequisites: '4U Calculus and Vectors; Honours Mathematics students only.',
      corequisites: null,
      antirequisites: 'MATH 116, 117, 124, 127, 137'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '148',
      title: 'Calculus 2 (Advanced Level)',
      description: 'MATH 148 is an advanced-level version of MATH 138.',
      units: 0.5,
      prerequisites: 'MATH 147; Honours Mathematics students only.',
      corequisites: null,
      antirequisites: 'MATH 118, 119, 128, 138'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '199',
      title: 'Mathematical Discovery and Invention',
      description: 'A course in problem solving in which intriguing and difficult problems are solved. Problems are taken mainly from the elementary parts of applied mathematics, computer science, statistics and actuarial science, pure mathematics, and combinatorics and optimization. Material relevant to the problems is taught in depth.',
      units: 0.5,
      prerequisites: 'Instructor Consent Required',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'MATH',
      catalogNumber: '207',
      title: 'Calculus 3 (Non-Specialist Level)',
      description: 'Multivariable functions and partial derivatives. Gradients. Optimization including Lagrange multipliers. Polar coordinates. Multiple integrals. Surface integrals on spheres and cylinders. Introduction to Fourier Series.',
      units: 0.5,
      prerequisites: 'MATH 128 or 138 or 148.',
      corequisites: null,
      antirequisites: 'AMATH 231, MATH 212, 212N/NE 217, MATH 217, 227, 237, 247'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '211',
      title: 'Advanced Calculus 1 for Electrical and Computer Engineers',
      description: 'Fourier series. Ordinary differential equations. Laplace transform. Applications to linear electrical systems.',
      units: 0.5,
      prerequisites: 'MATH 119; Not open to Mathematics students.',
      corequisites: null,
      antirequisites: 'AMATH 350, MATH 218, 228'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '212',
      title: 'Adv Calculus 2 for Electrical Engineers',
      description: 'Triple integrals, cylindrical and spherical polar coordinates. Divergence and curl, applications. Surface integrals, Green\'s, Gauss\' and Stokes\' theorems, applications. Complex functions, analytic functions, contour integrals, Cauchy\'s integral formula, Laurent series, residues.',
      units: 0.5,
      prerequisites: 'MATH 211/ECE 205; Not open to Mathematics students.',
      corequisites: null,
      antirequisites: 'AMATH 231, MATH 207, 217, 227, 237, 247'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '213',
      title: 'Signals, Systems, and Differential Equations',
      description: 'Laplace transform methods for: solving linear ordinary differential equations, classical signals, and systems. Transfer functions, poles, and zeros; system stability. Frequency response of linear systems and its log-scale representation (Bode plot). Fourier series. Applications in areas of interest for software engineers and computer scientists. Brief introduction to Fourier transforms in the context of signals and systems.',
      units: 0.5,
      prerequisites: 'One of MATH 118, MATH 119, MATH 128, MATH 138.',
      corequisites: null,
      antirequisites: 'AMATH 250, 251, MATH 211/ECE 205, 218, 228'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '215',
      title: 'Linear Algebra for Engineering',
      description: 'Systems of linear equations; their representation with matrices and vectors; their generalization to linear transformations on abstract vector spaces; and the description of these linear transformations through quantitative characteristics such as the determinant, the characteristic polynomial, eigenvalues and eigenvectors, the rank, and singular values.',
      units: 0.5,
      prerequisites: 'Level at least 2A Computer Engineering or Electrical Engineering students only.',
      corequisites: null,
      antirequisites: 'MATH 106, 114, 115, 136, 146, NE 112'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '217',
      title: 'Calculus 3 for Chemical Engineering',
      description: 'Curves and surfaces in R3. Multivariable functions, partial derivatives, the chain rule, gradients. Optimization, Lagrange Multipliers. Double and triple integrals, change of variable. Vector fields, divergence and curl. Vector integral calculus: Green\'s theorem, the Divergence theorem and Stokes\' theorem. Applications in engineering are emphasized.',
      units: 0.5,
      prerequisites: 'MATH 118; Not open to Mathematics students.',
      corequisites: null,
      antirequisites: 'AMATH 231, CIVE 221, ENVE 221, MATH 207, 212/ECE 206, 227, 237, 247, MATH 212N/NE 217, ME 201'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '218',
      title: 'Differential Equations for Engineers',
      description: 'First order equations, second order linear equations with constant coefficients, series solutions, the Laplace transform method, systems of linear differential equations. Applications in engineering are emphasized.',
      units: 0.5,
      prerequisites: 'One of MATH 118, 119, 128, 138, 148, SYDE 112; Engineering or Earth Science students only.',
      corequisites: null,
      antirequisites: 'AMATH 250, 251, 350, 351, CIVE 222, ENVE 223, MATH 211/ECE 205, 228, MATH 212N/NE 217, ME 203, SYDE 211'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '225',
      title: 'Applied Linear Algebra 2',
      description: 'Vector spaces. Linear transformations and matrices. Inner products. Eigenvalues and eigenvectors. Diagonalization. Applications.',
      units: 0.5,
      prerequisites: 'MATH 106 or 136 or 146.',
      corequisites: null,
      antirequisites: 'MATH 235, 245'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '227',
      title: 'Calculus 3 for Honours Physics',
      description: 'Directional derivative and the chain rule for multivariable functions. Optimization, Lagrange multipliers. Double and triple integrals on simple domains; transformations and Jacobians; change of variable in multiple integrals. Vector fields, divergence and curl. Vector integral calculus: Line and surface integrals, Green\'s Theorem, Stokes\' Theorem, Gauss\' Theorem, conservative vector fields.',
      units: 0.5,
      prerequisites: 'MATH 128 or 138; Only open to Science students in honours plans.',
      corequisites: null,
      antirequisites: 'AMATH 231, MATH 207, 212/ECE 206, 217, 237, 247, MATH 212N/NE 217'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '228',
      title: 'Differential Equations for Physics and Chemistry',
      description: 'First-order equations, second-order linear equations with constant coefficients, series solutions and special functions, the Laplace transform method. Applications in physics and chemistry are emphasized.',
      units: 0.5,
      prerequisites: 'MATH 128 or 138; Not open to Mathematics students.',
      corequisites: null,
      antirequisites: 'AMATH 250, 251, 350'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '229',
      title: 'Introduction to Combinatorics (Non-Specialist Level)',
      description: 'Introduction to graph theory: colourings, connectivity, Eulerian tours, planarity. Introduction to combinatorial analysis: elementary counting, generating series, binary strings.',
      units: 0.5,
      prerequisites: '(MATH 106 or 136 or 146) and (MATH 135 or 145).',
      corequisites: null,
      antirequisites: 'CO 220, MATH 239, 249'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '235',
      title: 'Linear Algebra 2 for Honours Mathematics',
      description: 'Orthogonal and unitary matrices and transformations. Orthogonal projections, Gram-Schmidt procedure, best approximations, least-squares. Inner products, angles and orthogonality, orthogonal diagonalization, singular value decomposition, applications.',
      units: 0.5,
      prerequisites: '(MATH 106 or 114 or 115 with a grade of at least 70%) or (MATH 136 with a grade of at least 60%) or MATH 146; Honours Mathematics or Mathematical Physics students.',
      corequisites: 'MATH 128 or 138 or 148.',
      antirequisites: 'MATH 225, 245'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '237',
      title: 'Calculus 3 for Honours Mathematics',
      description: 'Calculus of functions of several variables. Limits, continuity, differentiability, the chain rule. The gradient vector and the directional derivative. Taylor\'s formula. Optimization problems. Mappings and the Jacobian. Multiple integrals in various co-ordinate systems.',
      units: 0.5,
      prerequisites: '(One of MATH 106, 114, 115, 136, 146) and (MATH 128 with at least 70% or MATH 138 with at least 60% or MATH 148); Honours Math or Math/Physics students.',
      corequisites: null,
      antirequisites: 'MATH 207, 212/ECE 206, MATH 212N, 217, 227, 247'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '239',
      title: 'Introduction to Combinatorics',
      description: 'Introduction to graph theory: colourings, matchings, connectivity, planarity. Introduction to combinatorial analysis: generating series, recurrence relations, binary strings, plane trees.',
      units: 0.5,
      prerequisites: '((MATH 106 with a grade of at least 70% or MATH 136 or 146) and (MATH 135 with a grade of at least 60% or MATH 145)) or level at least 2A Software Engineering; Honours Mathematics students only.',
      corequisites: null,
      antirequisites: 'CO 220, MATH 229, 249'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '245',
      title: 'Linear Algebra 2 (Advanced Level)',
      description: 'MATH 245 is an advanced-level version of MATH 235.',
      units: 0.5,
      prerequisites: 'MATH 146; Honours Mathematics students only.',
      corequisites: null,
      antirequisites: 'MATH 225, 235'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '247',
      title: 'Calculus 3 (Advanced Level)',
      description: 'Topology of real n-dimensional space: completeness, closed and open sets, connectivity, compact sets, continuity, uniform continuity. Differential calculus on multivariable functions: partial differentiability, differentiability, chain rule, Taylor polynomials, extreme value problems. Riemann integration: Jordan content, integrability criteria, Fubini\'s theorem, change of variables. Local properties of continuously differentiable functions: open mapping theorem, inverse function theorem, implicit function theorem.',
      units: 0.5,
      prerequisites: 'MATH 146, 148; Honours Mathematics students only.',
      corequisites: null,
      antirequisites: 'MATH 237'
    },
    {
      courseCode: 'MATH',
      catalogNumber: '249',
      title: 'Introduction to Combinatorics (Advanced Level)',
      description: 'MATH 249 is an advanced-level version of MATH 239.',
      units: 0.5,
      prerequisites: '(MATH 135 with minimum grade of 80% or MATH 145) and (MATH 136 or 146); Honours Mathematics students only.',
      corequisites: null,
      antirequisites: 'CO 220, MATH 229, 239'
    },
    
    // CS courses
    {
      courseCode: 'CS',
      catalogNumber: '135',
      title: 'Designing Functional Programs',
      description: 'An introduction to the fundamentals of computer science through the application of elementary programming patterns in the functional style of programming. The course will emphasize the design and analysis of software using abstraction techniques.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'CS',
      catalogNumber: '136',
      title: 'Elementary Algorithm Design and Data Abstraction',
      description: 'This course builds on the techniques and patterns learned in CS 135 while making the transition to use of an imperative language. The course introduces the design and analysis of algorithms, the management of information, and the programming mechanisms and methodologies required in implementations.',
      units: 0.5,
      prerequisites: 'CS 135',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'CS',
      catalogNumber: '240',
      title: 'Data Structures and Data Management',
      description: 'Introduction to widely used and effective methods of data organization, focusing on data structures, their algorithms, and the performance of these algorithms. Specific topics include priority queues, sorting, dictionaries, data structures for text processing.',
      units: 0.5,
      prerequisites: 'CS 136',
      corequisites: null,
      antirequisites: null
    },
    
    // PHYS courses
    {
      courseCode: 'PHYS',
      catalogNumber: '121',
      title: 'Mechanics',
      description: 'Kinematics in one and two dimensions. Dynamics of a particle: Newton\'s second law; work, energy, power; conservative and non-conservative forces; momentum; collisions. Rotational kinematics and dynamics.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PHYS',
      catalogNumber: '122',
      title: 'Waves, Electricity and Magnetism',
      description: 'Oscillatory motion, wave propagation, sound waves, superposition, standing waves. Electrostatics, electric fields, electric potential, capacitance. Electric current, resistance, DC circuits. Magnetic fields, electromagnetic induction, AC circuits. Electromagnetic waves, light, optics.',
      units: 0.5,
      prerequisites: 'PHYS 121',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PHYS',
      catalogNumber: '234',
      title: 'Quantum Physics 1',
      description: 'The experimental basis of quantum mechanics; wave-particle duality, the Schrödinger equation, application to simple one-dimensional problems, including the harmonic oscillator; operator methods; angular momentum, the hydrogen atom.',
      units: 0.5,
      prerequisites: 'PHYS 122, MATH 237',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PHYS',
      catalogNumber: '242',
      title: 'Electricity and Magnetism 1',
      description: 'Electrostatics. Special techniques for calculating potentials. Electric fields in matter. Magnetostatics. Magnetic fields in matter. Electrodynamics.',
      units: 0.5,
      prerequisites: 'PHYS 122, MATH 237',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'PHYS',
      catalogNumber: '263',
      title: 'Classical Mechanics and Special Relativity',
      description: 'Elementary Lagrangian mechanics. Central force problems including planetary motion. Systems of particles and rigid body motion. Accelerated reference frames. Introduction to special relativity.',
      units: 0.5,
      prerequisites: 'PHYS 121, MATH 235, MATH 237',
      corequisites: null,
      antirequisites: null
    },
    
    // Other courses
    {
      courseCode: 'ENGL',
      catalogNumber: '192',
      title: 'Communication in Mathematics and Computer Science',
      description: 'This course builds communications skills in the mathematical and computer sciences. Students learn to read mathematics and computer science texts, create technical content, organize technical material, and develop and adapt their communications for targeted technical and general audiences.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    }
  ];
  
  for (const course of courses) {
    await prisma.course.create({
      data: course
    });
  }
  
  console.log(`Seeded ${courses.length} courses`);
}