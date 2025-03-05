import { PrismaClient } from '@prisma/client';

export async function seedFaculties(prisma: PrismaClient) {
  console.log('Seeding faculties...');
  
  const faculties = [
    {
      name: 'Mathematics',
      description: 'The Faculty of Mathematics includes the departments of Applied Mathematics, Combinatorics and Optimization, Computer Science, Pure Mathematics, and Statistics and Actuarial Science.'
    },
    {
      name: 'Engineering',
      description: 'The Faculty of Engineering offers undergraduate degrees in a variety of engineering disciplines, including chemical, civil, computer, electrical, environmental, mechanical, mechatronics, nanotechnology, and systems design engineering.'
    },
    {
      name: 'Science',
      description: 'The Faculty of Science offers programs in biology, chemistry, earth and environmental sciences, physics and astronomy, and more.'
    },
    {
      name: 'Arts',
      description: 'The Faculty of Arts offers programs in humanities, languages, fine and performing arts, and social sciences.'
    },
    {
      name: 'Health',
      description: 'The Faculty of Health offers programs in kinesiology, health studies, recreation and leisure studies, and public health.'
    },
    {
      name: 'Environment',
      description: 'The Faculty of Environment offers programs in environment, business, and sustainability, geography and environmental management, planning, and aviation.'
    }
  ];
  
  for (const faculty of faculties) {
    await prisma.faculty.create({
      data: faculty
    });
  }
  
  console.log(`Seeded ${faculties.length} faculties`);
}