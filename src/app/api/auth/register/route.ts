import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";
import { generateVerificationToken } from "@/lib/verification";
import { sendVerificationEmail } from "@/lib/email";

const userSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate the request body
    const result = userSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { email, password } = result.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user with emailVerified set to null (unverified)
    const user = await prisma.user.create({
      data: {
        name: email.split('@')[0], // Use the part before @ as the name
        email,
        password: hashedPassword,
        emailVerified: null, // Explicitly set to null to indicate unverified
      },
    });
    
    let verificationToken = "";
    let emailSent = false;

    try {
      // Generate verification token
      verificationToken = await generateVerificationToken(user.id, email);
      
      // Send verification email
      try {
        await sendVerificationEmail(email, verificationToken);
        console.log(`Verification email process completed for ${email}`);
        emailSent = true;
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
        // Continue with registration even if email fails
      }
    } catch (tokenError) {
      console.error("Error generating verification token:", tokenError);
      // Continue with registration even if token generation fails
    }
    
    // Don't return the password
    const { password: _, ...userWithoutPassword } = user;
    
    return NextResponse.json(
      { 
        message: "User created successfully. Please check your email to verify your account.", 
        user: userWithoutPassword,
        verificationSent: emailSent
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
}