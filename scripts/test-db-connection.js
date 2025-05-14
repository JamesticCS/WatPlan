// Simple script to test Supabase connection
const { PrismaClient } = require('@prisma/client');

// Use this to test with a different connection string than your .env file
// process.env.DATABASE_URL = 'postgresql://postgres.efnfqilobksvtxklftdx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true&ssl=true';

async function main() {
  console.log('Testing database connection...');
  console.log('Using connection URL:', process.env.DATABASE_URL);
  
  try {
    const prisma = new PrismaClient();
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1+1 AS result`;
    console.log('Query result:', result);
    
    // Try to count users
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    console.log('Database connection successful!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database connection failed:', error);
  }
}

main()
  .catch(console.error);