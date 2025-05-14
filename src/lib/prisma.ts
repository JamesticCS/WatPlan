import { PrismaClient } from "@prisma/client";

// Helper function to handle Prisma connection retries
function getPrismaClient() {
  const client = new PrismaClient({
    log: ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
  });
  
  // Add custom error handling with retry logic for prepared statement errors
  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error: any) {
      // Log the error
      console.error('Prisma error:', error);
      
      // Check if it's a "prepared statement already exists" error
      const isPreparedStatementError = 
        error.message && 
        (error.message.includes('prepared statement') || 
         (error.code === '42P05'));
      
      if (isPreparedStatementError) {
        console.log('Detected prepared statement error, attempting to recover connection...');
        
        // For this specific error, we disconnect and reconnect before retrying
        try {
          await client.$disconnect();
          await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
          
          // Retry the operation once
          console.log('Retrying database operation...');
          return await next(params);
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
          throw retryError;
        }
      }
      
      // For other errors, just propagate
      throw error;
    }
  });
  
  return client;
}

declare global {
  var prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
export const prisma = global.prisma || getPrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;