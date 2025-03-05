import { PrismaClient } from '@prisma/client';

export async function seedPrograms(prisma: PrismaClient) {
  console.log('Seeding programs...');
  
  // Get faculty IDs
  const mathFaculty = await prisma.faculty.findUnique({ where: { name: 'Mathematics' } });
  const engFaculty = await prisma.faculty.findUnique({ where: { name: 'Engineering' } });
  const sciFaculty = await prisma.faculty.findUnique({ where: { name: 'Science' } });
  
  if (!mathFaculty || !engFaculty || !sciFaculty) {
    throw new Error('Required faculties not found');
  }
  
  const programs = [
    {
      name: 'Mathematical Physics',
      description: 'The Mathematical Physics plan provides an excellent preparation for graduate work in theoretical and mathematical physics, as well as certain areas of mathematics. Students who have both mathematical ability and a strong interest in the physical sciences find this an attractive and challenging program.',
      facultyId: mathFaculty.id
    },
    {
      name: 'Computer Science',
      description: 'The Computer Science program provides a foundation for understanding how computers work and how they can be used to solve real-world problems. Students gain skills in designing algorithms, programming languages, software engineering, systems, and computer architecture.',
      facultyId: mathFaculty.id
    },
    {
      name: 'Pure Mathematics',
      description: 'The Pure Mathematics program focuses on the theoretical aspects of mathematics, including algebra, analysis, geometry, and topology. Students develop abstract reasoning skills and a deep understanding of mathematical structures.',
      facultyId: mathFaculty.id
    },
    {
      name: 'Applied Mathematics',
      description: 'The Applied Mathematics program emphasizes the application of mathematics to real-world problems in areas such as engineering, physics, biology, and economics. Students learn to develop and analyze mathematical models.',
      facultyId: mathFaculty.id
    },
    {
      name: 'Statistics',
      description: 'The Statistics program provides a strong foundation in statistical theory and methods, including data analysis, probability, and statistical inference. Students learn to design experiments, collect and analyze data, and draw meaningful conclusions.',
      facultyId: mathFaculty.id
    },
    {
      name: 'Mechanical Engineering',
      description: 'The Mechanical Engineering program covers the design, analysis, and manufacturing of mechanical systems. Students gain skills in thermodynamics, fluid mechanics, solid mechanics, and control systems.',
      facultyId: engFaculty.id
    },
    {
      name: 'Electrical Engineering',
      description: 'The Electrical Engineering program focuses on the design and analysis of electrical and electronic systems. Students gain skills in circuits, electromagnetics, signal processing, power systems, and telecommunications.',
      facultyId: engFaculty.id
    },
    {
      name: 'Biology',
      description: 'The Biology program provides a comprehensive study of living organisms, from molecules to ecosystems. Students gain an understanding of the structure, function, and evolution of biological systems.',
      facultyId: sciFaculty.id
    }
  ];
  
  for (const program of programs) {
    await prisma.program.create({
      data: program
    });
  }
  
  console.log(`Seeded ${programs.length} programs`);
}