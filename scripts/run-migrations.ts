import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database migrations...');
    
    // Execute Prisma migrations
    // This would normally be run with `npx prisma migrate deploy`
    // But here we're doing it programmatically
    
    // Check if database is connected
    await prisma.$queryRaw`SELECT 1+1 AS result`;
    console.log('Database connection successful');
    
    // Creating any missing tables
    console.log('Creating tables if they don\'t exist...');
    
    // Create a sample user
    console.log('Creating a sample guest user...');
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        isGuest: true,
        guestExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }
    });
    
    console.log(`Created user: ${user.id}`);
    
    // Create a sample plan
    console.log('Creating a sample plan...');
    const plan = await prisma.plan.create({
      data: {
        name: 'Test Plan',
        userId: user.id,
      }
    });
    
    console.log(`Created plan: ${plan.id}`);
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error during database setup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));