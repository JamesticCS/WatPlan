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
    console.log("Registration API called");
    const body = await req.json();
    console.log("Registration body received:", { email: body.email });
    
    // Validate the request body
    const result = userSchema.safeParse(body);
    if (!result.success) {
      console.log("Validation error:", result.error.flatten());
      return NextResponse.json(
        { message: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    
    const { email, password } = result.data;
    console.log("Validated email:", email);
    
    // Check if user already exists
    console.log("Checking if user exists...");
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      console.log("User already exists:", existingUser.id);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }
    
    // Hash the password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user with emailVerified set to null (unverified)
    console.log("Creating new user...");
    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: email.split('@')[0], // Use the part before @ as the name
          email,
          password: hashedPassword,
          emailVerified: null, // Explicitly set to null to indicate unverified
        },
      });
      console.log("User created:", user.id);
    } catch (createError) {
      console.error("Error creating user:", createError);
      return NextResponse.json(
        { message: "Failed to create user account. This email might have been used before." },
        { status: 500 }
      );
    }
    
    let verificationToken = "";
    let emailSent = false;

    try {
      // Generate verification token
      console.log("Generating verification token...");
      verificationToken = await generateVerificationToken(user.id, email);
      console.log("Token generated successfully");
      
      // Send verification email
      try {
        console.log("Sending verification email...");
        await sendVerificationEmail(email, verificationToken);
        console.log(`Verification email sent to ${email}`);
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
    
    console.log("Registration completed successfully");
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
    
    // Try to provide more specific error messages
    let errorMessage = "An error occurred during registration";
    if (error instanceof Error) {
      errorMessage = `Registration error: ${error.message}`;
      console.error(error.stack);
    }
    
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}