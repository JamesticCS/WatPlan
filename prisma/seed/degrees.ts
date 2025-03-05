import { PrismaClient } from '@prisma/client';

export async function seedDegrees(prisma: PrismaClient) {
  console.log('Seeding degrees...');
  
  // Get program IDs
  const mathPhysics = await prisma.program.findFirst({ where: { name: 'Mathematical Physics' } });
  const cs = await prisma.program.findFirst({ where: { name: 'Computer Science' } });
  const pureMath = await prisma.program.findFirst({ where: { name: 'Pure Mathematics' } });
  const appliedMath = await prisma.program.findFirst({ where: { name: 'Applied Mathematics' } });
  const stats = await prisma.program.findFirst({ where: { name: 'Statistics' } });
  const mechEng = await prisma.program.findFirst({ where: { name: 'Mechanical Engineering' } });
  const elecEng = await prisma.program.findFirst({ where: { name: 'Electrical Engineering' } });
  const biology = await prisma.program.findFirst({ where: { name: 'Biology' } });
  
  if (!mathPhysics || !cs || !pureMath || !appliedMath || !stats || !mechEng || !elecEng || !biology) {
    throw new Error('Required programs not found');
  }
  
  const degrees = [
    {
      name: 'Bachelor of Mathematics (Honours)',
      description: 'The BMath (Honours) with the Mathematical Physics plan is a specialized program that combines mathematics and physics.',
      programId: mathPhysics.id
    },
    {
      name: 'Bachelor of Computer Science (Honours)',
      description: 'The BCS (Honours) program provides a deep understanding of computer science fundamentals and practical skills.',
      programId: cs.id
    },
    {
      name: 'Bachelor of Mathematics (Honours)',
      description: 'The BMath (Honours) with the Computer Science major prepares students for careers in computing.',
      programId: cs.id
    },
    {
      name: 'Bachelor of Mathematics (Honours)',
      description: 'The BMath (Honours) with the Pure Mathematics major focuses on the theoretical aspects of mathematics.',
      programId: pureMath.id
    },
    {
      name: 'Bachelor of Mathematics (Honours)',
      description: 'The BMath (Honours) with the Applied Mathematics major emphasizes the application of mathematics to real-world problems.',
      programId: appliedMath.id
    },
    {
      name: 'Bachelor of Mathematics (Honours)',
      description: 'The BMath (Honours) with the Statistics major provides a strong foundation in statistical theory and methods.',
      programId: stats.id
    },
    {
      name: 'Bachelor of Applied Science',
      description: 'The BASc in Mechanical Engineering program covers the design, analysis, and manufacturing of mechanical systems.',
      programId: mechEng.id
    },
    {
      name: 'Bachelor of Applied Science',
      description: 'The BASc in Electrical Engineering program focuses on the design and analysis of electrical and electronic systems.',
      programId: elecEng.id
    },
    {
      name: 'Bachelor of Science (Honours)',
      description: 'The BSc (Honours) in Biology program provides a comprehensive study of living organisms.',
      programId: biology.id
    }
  ];
  
  for (const degree of degrees) {
    const createdDegree = await prisma.degree.create({
      data: degree
    });
    
    // Create requirement sets for each degree
    await prisma.degreeRequirementSet.create({
      data: {
        name: 'Core Requirements',
        description: 'Core courses required for the degree',
        degreeId: createdDegree.id
      }
    });
    
    await prisma.degreeRequirementSet.create({
      data: {
        name: 'Additional Requirements',
        description: 'Additional courses and requirements for the degree',
        degreeId: createdDegree.id
      }
    });
  }
  
  console.log(`Seeded ${degrees.length} degrees`);
}