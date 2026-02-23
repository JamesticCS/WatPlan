import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const planCount = await prisma.plan.count();
    const courseCount = await prisma.course.count();

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
            createdAt: true,
            updatedAt: true,
          }
        }
      },
      take: 100
    });

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
          take: 20
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    const courses = await prisma.course.findMany({
      take: 50,
      orderBy: {
        code: 'asc'
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
