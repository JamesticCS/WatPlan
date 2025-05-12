import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // First, return database connection info for debugging
    const connectionInfo = {
      database_url: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.replace(/(:.*@)/, ':***@') : 'Not set',
      node_env: process.env.NODE_ENV,
      vercel_region: process.env.VERCEL_REGION || 'Unknown',
      prisma_version: require('@prisma/client/package.json').version,
    };
    
    // Simple database query to test connection
    let result;
    try {
      result = await prisma.$queryRaw`SELECT 1+1 AS result`;
    } catch (queryError) {
      return NextResponse.json({
        status: "error",
        message: "Database query failed",
        connectionInfo,
        error: queryError instanceof Error ? queryError.message : String(queryError)
      }, { status: 500 });
    }
    
    // If we got here, the basic connection works, try more complex queries
    let counts = {};
    try {
      // Count users
      const userCount = await prisma.user.count();
      
      // Count plans
      const planCount = await prisma.plan.count();
      
      // Count courses
      const courseCount = await prisma.course.count();
      
      counts = { users: userCount, plans: planCount, courses: courseCount };
    } catch (countError) {
      return NextResponse.json({
        status: "partial_success",
        message: "Database connected but table access failed",
        connectionInfo,
        result,
        error: countError instanceof Error ? countError.message : String(countError)
      }, { status: 207 });
    }
    
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      connectionInfo,
      data: {
        result,
        counts
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? 
        { message: error.message, stack: error.stack } : 
        String(error)
    }, { status: 500 });
  }
}