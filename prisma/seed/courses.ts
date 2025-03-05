import { PrismaClient } from '@prisma/client';

export async function seedCourses(prisma: PrismaClient) {
  console.log('Seeding courses...');
  
  const courses = [
    // MATH courses
    {
      courseCode: 'MATH',
      catalogNumber: '135',
      title: 'Algebra for Honours Mathematics',
      description: 'Introduction to the language of mathematics and proof techniques through a study of the basic algebraic systems of mathematics: the integers, the integers modulo n, the rational numbers, the real numbers, the complex numbers and polynomials.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'MATH',
      catalogNumber: '136',
      title: 'Linear Algebra 1 for Honours Mathematics',
      description: 'Systems of linear equations, matrices, determinants, vector spaces, linear transformations, bases, rank, eigenvalues, eigenvectors and diagonalization.',
      units: 0.5,
      prerequisites: 'MATH 135',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'MATH',
      catalogNumber: '137',
      title: 'Calculus 1 for Honours Mathematics',
      description: 'Limits, continuity, differentiation, applications of derivatives, definite integrals, fundamental theorem of calculus, techniques of integration, applications of integration.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'MATH',
      catalogNumber: '138',
      title: 'Calculus 2 for Honours Mathematics',
      description: 'Sequences, series, power series, Taylor polynomials, Taylor series, vectors, dot product, cross product, planes, lines, derivatives of functions of several variables, gradient, directional derivative, optimization of functions of several variables, double integrals.',
      units: 0.5,
      prerequisites: 'MATH 137',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'MATH',
      catalogNumber: '235',
      title: 'Linear Algebra 2 for Honours Mathematics',
      description: 'Orthogonality, orthogonal projections, Gram-Schmidt process, least squares, inner product spaces, isomorphisms of vector spaces. Change of basis, eigenvalues, eigenvectors, and diagonalization. Applications.',
      units: 0.5,
      prerequisites: 'MATH 136',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'MATH',
      catalogNumber: '237',
      title: 'Calculus 3 for Honours Mathematics',
      description: 'Calculus of functions of several variables: partial derivatives, gradient, chain rule, inverse function theorem, change of variables for multiple integrals, vector functions, line integrals, surface integrals, Stokes\' theorem, Divergence theorem, and physical applications.',
      units: 0.5,
      prerequisites: 'MATH 138',
      corequisites: null,
      antirequisites: null
    },
    {
      courseCode: 'MATH',
      catalogNumber: '239',
      title: 'Introduction to Combinatorics',
      description: 'Introduction to graph theory: colourings, matchings, connectivity, planarity. Introduction to combinatorial analysis: generating series, recurrence relations, binary strings, plane trees.',
      units: 0.5,
      prerequisites: 'MATH 135',
      corequisites: null,
      antirequisites: null
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