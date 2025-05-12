import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Simple database query to test connection
    const result = await prisma.$queryRaw`SELECT 1+1 AS result`;
    
    // Count users
    const userCount = await prisma.user.count();
    
    // Count plans
    const planCount = await prisma.plan.count();
    
    // Count courses
    const courseCount = await prisma.course.count();
    
    return NextResponse.json({
      status: "success",
      message: "Database connection successful",
      data: {
        result,
        counts: {
          users: userCount,
          plans: planCount,
          courses: courseCount
        }
      }
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({
      status: "error",
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}