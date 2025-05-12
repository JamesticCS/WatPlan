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
  
  // Add custom error handling
  client.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      console.error('Prisma error:', error);
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