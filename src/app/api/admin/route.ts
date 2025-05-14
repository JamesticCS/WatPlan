import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get basic counts
    const userCount = await prisma.user.count();
    const planCount = await prisma.plan.count();
    const courseCount = await prisma.course.count();
    
    // Get limited user data (excluding sensitive fields)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        isGuest: true,
        guestExpiresAt: true,
        createdAt: true,
        plans: {
          select: {
            id: true,
            name: true,
            created: true,
            updated: true,
          }
        }
      },
      take: 100 // Limit to 100 users
    });
    
    // Get most recently created plans
    const plans = await prisma.plan.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        courses: {
          include: {
            course: true
          },
          take: 20 // Limit courses per plan
        }
      },
      orderBy: {
        created: 'desc'
      },
      take: 20 // Limit to 20 recent plans
    });
    
    // Sample of courses
    const courses = await prisma.course.findMany({
      take: 50, // Limit to 50 courses
      orderBy: {
        courseCode: 'asc'
      }
    });
    
    return NextResponse.json({
      status: "success",
      counts: {
        users: userCount,
        plans: planCount,
        courses: courseCount
      },
      data: {
        users,
        plans,
        courses
      }
    });
  } catch (error) {
    console.error("Admin data fetch error:", error);
    return NextResponse.json({
      status: "error",
      message: "Failed to fetch admin data",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}