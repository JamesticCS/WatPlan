import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const convertSchema = z.object({
  guestId: z.string().min(1, "Guest ID is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the request body
    const result = convertSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { guestId, email, password } = result.data;
    
    // Check if the guest user exists
    const guestUser = await prisma.user.findUnique({
      where: { id: guestId },
      include: { plans: true }
    });
    
    if (!guestUser || !guestUser.isGuest) {
      return NextResponse.json(
        { message: "Guest user not found" },
        { status: 404 }
      );
    }
    
    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser && existingUser.id !== guestId) {
      return NextResponse.json(
        { message: "Email is already in use" },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update the guest user to a permanent account
    const updatedUser = await prisma.user.update({
      where: { id: guestId },
      data: {
        name: email.split('@')[0], // Use the part before @ as the name
        email,
        password: hashedPassword,
        isGuest: false,
        guestExpiresAt: null,
      },
    });
    
    // Don't return the password
    const { password: _, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json(
      { message: "Guest account converted successfully", user: userWithoutPassword },
      { status: 200 }
    );
  } catch (error) {
    console.error("Account conversion error:", error);
    return NextResponse.json(
      { message: "An error occurred during account conversion" },
      { status: 500 }
    );
  }
}