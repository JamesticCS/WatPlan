import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

const resendSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the request body
    const result = resendSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    
    // Check if user exists and is not verified
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, emailVerified: true },
    });
    
    if (!user) {
      // For security reasons, don't reveal if the user exists or not
      return NextResponse.json(
        { message: "If a user with this email exists, a verification link has been sent." },
        { status: 200 }
      );
    }
    
    // Only send verification if not already verified
    if (!user.emailVerified) {
      // Generate a new verification token
      const verificationToken = await generateVerificationToken(user.id, user.email);
      
      // Send verification email
      await sendVerificationEmail(user.email, verificationToken);
    }
    
    // For security reasons, always return the same response
    return NextResponse.json(
      { message: "If a user with this email exists, a verification link has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { message: "An error occurred while sending the verification email" },
      { status: 500 }
    );
  }
}