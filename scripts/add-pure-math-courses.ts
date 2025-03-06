import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Adding Pure Mathematics courses to the database...');

  // Define all Pure Math courses
  const pureMathCourses = [
    // PMATH 300s
    {
      courseId: '015485',
      courseCode: 'PMATH',
      catalogNumber: '320',
      title: 'Euclidean Geometry',
      description: 'Euclid\'s axioms, triangle centres, conic sections, compass-and-straightedge constructions, isometries of the Euclidean plane and of Euclidean space, regular and star-shaped polygons, tessellations of the Euclidean plane, regular and quasi-regular polyhedra, symmetries of polygons and polyhedra, four-dimensional polytopes, sphere packings, and the kissing problem. Applications.',
      units: 0.5,
      prerequisites: '(MATH 106 or 114 or 115 or 136 or 146 or 215 or NE 112) and (MATH 104 or 109 or 116 or 117 or 124 or 127 or 137 or 147)',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '015486',
      courseCode: 'PMATH',
      catalogNumber: '321',
      title: 'Non-Euclidean Geometry',
      description: 'An introduction to three types of non-Euclidean geometry: spherical, projective and hyperbolic geometry. Lines, distances, circles, triangles, and areas in these non-Euclidean spaces. Conic sections in the projective plane. Inversions and orthogonal circles. Models of the hyperbolic plane (such as the Poincaré disc model or the upper-half plane model). Tilings of the hyperbolic plane.',
      units: 0.5,
      prerequisites: '(MATH 106 or 114 or 115 or 136 or 146 or 215 or NE 112) and (MATH 104 or 109 or 116 or 117 or 124 or 127 or 137 or 147)',
      corequisites: null,
      antirequisites: 'PMATH 360'
    },
    {
      courseId: '007659',
      courseCode: 'PMATH',
      catalogNumber: '330',
      title: 'Introduction to Mathematical Logic',
      description: 'A broad introduction to mathematical logic. The notions of logical consequence and derivation are introduced in the settings of propositional and first order logic, with discussions of the completeness theorem and satisfiability.',
      units: 0.5,
      prerequisites: '(MATH 135 or 145) and (MATH 225 or 235 or 245); Not open to Computer Science students',
      corequisites: null,
      antirequisites: 'CS 245, SE 212'
    },
    {
      courseId: '003323',
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
      courseId: '003324',
      courseCode: 'PMATH',
      catalogNumber: '332',
      title: 'Applied Complex Analysis',
      description: 'Complex numbers, Cauchy-Riemann equations, analytic functions, conformal maps and applications to the solution of Laplace\'s equation, contour integrals, Cauchy integral formula, Taylor and Laurent expansions, residue calculus and applications.',
      units: 0.5,
      prerequisites: 'MATH 237 or 247',
      corequisites: null,
      antirequisites: 'PHYS 365'
    },
    {
      courseId: '015092',
      courseCode: 'PMATH',
      catalogNumber: '333',
      title: 'Introduction to Real Analysis',
      description: 'The purpose of the course is to present the familiar concepts of calculus at a rigorous level and to provide students who took the MATH 137/MATH 138/MATH 237 sequence with the background needed to be successful in PMATH 351 and PMATH 352. Topics discussed include the completeness properties of the reals; the density of the rationals; the topology of real n-dimensional space: open and closed sets, connectedness, compactness (by open covers), the Heine-Borel theorem, completeness; sequences in real n-dimensional space: convergence, Cauchy sequences, subsequences, the Bolzano-Weierstrass theorem; multivariable functions: limits, point-wise and uniform continuity, the extreme value theorem, uniform convergence of sequences of functions, Taylor\'s theorem, term-by-term differentiation of power series; integration in real n-dimensional space: Riemann integrability, Fubini\'s theorem for continuous functions on rectangles, term-by-term integration of power series.',
      units: 0.5,
      prerequisites: 'One of (MATH 128 with at least 70%), (MATH 138 with at least 60%), MATH 148',
      corequisites: '(MATH 235 or 245) and MATH 237',
      antirequisites: 'MATH 247'
    },
    {
      courseId: '007662',
      courseCode: 'PMATH',
      catalogNumber: '334',
      title: 'Introduction to Rings and Fields with Applications',
      description: 'Rings, ideals, factor rings, homomorphisms, finite and infinite fields, polynomials and roots, field extensions, algebraic numbers, and applications, for example, to Latin squares, finite geometries, geometrical constructions, error-correcting codes.',
      units: 0.5,
      prerequisites: 'MATH 235 or 245',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '007663',
      courseCode: 'PMATH',
      catalogNumber: '336',
      title: 'Introduction to Group Theory with Applications',
      description: 'Groups, permutation groups, subgroups, homomorphisms, symmetry groups in two and three dimensions, direct products, Polya-Burnside enumeration.',
      units: 0.5,
      prerequisites: 'MATH 235 or 245',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '007664',
      courseCode: 'PMATH',
      catalogNumber: '340',
      title: 'Elementary Number Theory',
      description: 'An elementary approach to the theory of numbers; the Euclidean algorithm, congruence equations, multiplicative functions, solutions to Diophantine equations, continued fractions, and rational approximations to real numbers.',
      units: 0.5,
      prerequisites: 'MATH 225 or 135 or 145',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '007665',
      courseCode: 'PMATH',
      catalogNumber: '343',
      title: 'Introduction to the Mathematics of Quantum Information',
      description: 'Finite dimensional normed vector spaces and inner product spaces. Positive and normal operators, the spectral theorem, and singular value decomposition. Tensor products, finite dimensional C* algebras, and the GNS representation. Completely positive maps, Stinespring\'s theorem, the Choi-Jamiolkowski isomorphism, and the Choi-Krauss representation. Entanglement and the Bell and Tsirelson inequalities. Vector states and density matrices, quantum channels, observables, and quantum measurement.',
      units: 0.5,
      prerequisites: '(MATH 235 or 245) and (AMATH/PMATH 331 or MATH 247 or PMATH 333)',
      corequisites: null,
      antirequisites: 'PMATH 399 taken Winter 2019'
    },
    {
      courseId: '014182',
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
      courseId: '014183',
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
      courseId: '007669',
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
      courseId: '007672',
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
      courseId: '003325',
      courseCode: 'PMATH',
      catalogNumber: '365',
      title: 'Differential Geometry',
      description: 'Submanifolds of Euclidean n-space; vector fields and differential forms; integration on submanifolds and Stokes\'s Theorem; metrics and geodesics; Gauss-Bonnet Theorem.',
      units: 0.5,
      prerequisites: '(MATH 235 or 245) and (MATH 237 or 247)',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '009496',
      courseCode: 'PMATH',
      catalogNumber: '370',
      title: 'Chaos and Fractals',
      description: 'The mathematics of iterated functions, properties of discrete dynamical systems, Mandelbrot and Julia sets.',
      units: 0.5,
      prerequisites: '(One of MATH 118, 119, 128, 138, 148) and (One of MATH 114, 115, 136, 146, 225)',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '007680',
      courseCode: 'PMATH',
      catalogNumber: '399',
      title: 'Readings in Pure Mathematics',
      description: 'Reading course as announced by the Department.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    },

    // PMATH 400s
    {
      courseId: '007687',
      courseCode: 'PMATH',
      catalogNumber: '432',
      title: 'First Order Logic and Computability',
      description: 'The concepts of formal provability and logical consequence in first order logic are introduced, and their equivalence is proved in the soundness and completeness theorems. Goedel\'s incompleteness theorem is discussed, making use of the halting problem of computability theory. Relative computability and the Turing degrees are further studied.',
      units: 0.5,
      prerequisites: 'PMATH 347',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '012623',
      courseCode: 'PMATH',
      catalogNumber: '433',
      title: 'Model Theory and Set Theory',
      description: 'Model theory: the semantics of first order logic including the compactness theorem and its consequences, elementary embeddings and equivalence, the theory of definable sets and types, quantifier elimination, and omega-stability. Set theory: well-orderings, ordinals, cardinals, Zermelo-Fraenkel axioms, axiom of choice, informal discussion of classes and independence results.',
      units: 0.5,
      prerequisites: 'PMATH 347',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '007690',
      courseCode: 'PMATH',
      catalogNumber: '440',
      title: 'Analytic Number Theory',
      description: 'Summation methods, analytic theory of the Riemann zeta function, Prime Number Theorem, primitive roots, quadratic reciprocity. Dirichlet characters and infinitude of primes in arithmetic progressions, and assorted topics.',
      units: 0.5,
      prerequisites: 'PMATH 352',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '007691',
      courseCode: 'PMATH',
      catalogNumber: '441',
      title: 'Algebraic Number Theory',
      description: 'An introduction to algebraic number theory; unique factorization, Dedekind domains, class numbers, Dirichlet\'s unit theorem, solutions of Diophantine equations.',
      units: 0.5,
      prerequisites: 'PMATH 348',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '014184',
      courseCode: 'PMATH',
      catalogNumber: '445',
      title: 'Representations of Finite Groups',
      description: 'Basic definitions and examples: subrepresentations and irreducible representations, tensor products of representations. Character theory. Representations as modules over the group ring, Artin-Wedderburn structure theorem for semisimple rings. Induced representations, Frobenius reciprocity, Mackey\'s irreducibility criterion.',
      units: 0.5,
      prerequisites: 'PMATH 347',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '014185',
      courseCode: 'PMATH',
      catalogNumber: '446',
      title: 'Introduction to Commutative Algebra',
      description: 'Module theory: classification of finitely generated modules over PIDs, exact sequences and tensor products, algebras, localisation, chain conditions. Primary decomposition, integral extensions, Noether\'s normalisation lemma, and Hilbert\'s Nullstellensatz.',
      units: 0.5,
      prerequisites: 'PMATH 347',
      corequisites: 'PMATH 348',
      antirequisites: null
    },
    {
      courseId: '007674',
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
      courseId: '003348',
      courseCode: 'PMATH',
      catalogNumber: '451',
      title: 'Measure and Integration',
      description: 'General measures, measurability, Caratheodory Extension theorem and construction of measures, integration theory, convergence theorems, Lp-spaces, absolute continuity, differentiation of monotone functions, Radon-Nikodym theorem, product measures, Fubini\'s theorem, signed measures, Urysohn\'s lemma, Riesz Representation theorems for classical Banach spaces.',
      units: 0.5,
      prerequisites: 'PMATH 450 with a grade of at least 60%',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '003349',
      courseCode: 'PMATH',
      catalogNumber: '453',
      title: 'Functional Analysis',
      description: 'Banach and Hilbert spaces, bounded linear maps, Hahn-Banach theorem, open mapping theorem, closed graph theorem, topologies, nets, Hausdorff spaces, Tietze extension theorem, dual spaces, weak topologies, Tychonoff\'s theorem, Banach-Alaoglu theorem, reflexive spaces.',
      units: 0.5,
      prerequisites: 'PMATH 450',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '010733',
      courseCode: 'PMATH',
      catalogNumber: '464',
      title: 'Introduction to Algebraic Geometry',
      description: 'An introduction to algebraic geometry through the theory of algebraic curves. General algebraic geometry: affine and projective algebraic sets, Hilbert\'s Nullstellensatz, co-ordinate rings, polynomial maps, rational functions and local rings. Algebraic curves: affine and projective plane curves, tangency and multiplicity, intersection numbers, Bezout\'s theorem and divisor class groups.',
      units: 0.5,
      prerequisites: 'PMATH 347',
      corequisites: 'PMATH 348',
      antirequisites: null
    },
    {
      courseId: '003350',
      courseCode: 'PMATH',
      catalogNumber: '465',
      title: 'Smooth Manifolds',
      description: 'Point-set topology; smooth manifolds, smooth maps, and tangent vectors; the tangent and cotangent bundles; vector fields, tensor fields, and differential forms; Stokes\'s theorem; integral curves, Lie derivatives, the Frobenius theorem; de Rham cohomology.',
      units: 0.5,
      prerequisites: 'PMATH 365',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '007704',
      courseCode: 'PMATH',
      catalogNumber: '467',
      title: 'Algebraic Topology',
      description: 'Topological spaces and topological manifolds; quotient spaces; cut and paste constructions; classification of two-dimensional manifolds; fundamental group; homology groups. Additional topics may include: covering spaces; homotopy theory; selected applications to knots and combinatorial group theory.',
      units: 0.5,
      prerequisites: 'PMATH 347, 351',
      corequisites: null,
      antirequisites: null
    },
    {
      courseId: '007706',
      courseCode: 'PMATH',
      catalogNumber: '499',
      title: 'Readings in Pure Mathematics',
      description: 'Reading course as announced by the Department.',
      units: 0.5,
      prerequisites: null,
      corequisites: null,
      antirequisites: null
    }
  ];

  // Add all courses to the database
  for (const course of pureMathCourses) {
    try {
      await prisma.course.upsert({
        where: {
          courseCode_catalogNumber: {
            courseCode: course.courseCode,
            catalogNumber: course.catalogNumber
          }
        },
        update: {
          title: course.title,
          description: course.description,
          units: course.units,
          prerequisites: course.prerequisites,
          corequisites: course.corequisites,
          antirequisites: course.antirequisites
        },
        create: {
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
    } catch (error) {
      console.error(`Error adding course ${course.courseCode} ${course.catalogNumber}:`, error);
    }
  }

  console.log(`Added ${pureMathCourses.length} Pure Mathematics courses to the database.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });