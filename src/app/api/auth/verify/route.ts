import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/verification";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    console.log("Verification API called");
    const token = req.nextUrl.searchParams.get("token");
    console.log("Token received:", token);
    
    if (!token) {
      console.log("Error: Token missing");
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }
    
    // Verify the token
    console.log("Verifying token...");
    const verificationResult = await verifyToken(token);
    console.log("Verification result:", verificationResult);
    
    if (!verificationResult) {
      console.log("Error: Invalid/expired token");
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }
    
    const { userId, email } = verificationResult;
    console.log("User found:", userId, email);
    
    // Update the user's emailVerified status
    console.log("Updating user's emailVerified status");
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });
    
    console.log("User verified successfully");
    return NextResponse.json(
      { message: "Email verified successfully! You can now sign in to your account." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "An error occurred during email verification" },
      { status: 500 }
    );
  }
}

// Development-only route to bypass email verification
export async function POST(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { message: "This endpoint is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Update the user's emailVerified field
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
    
    console.log(`[DEV MODE] Email verification bypassed for ${email}`);
    
    return NextResponse.json(
      { message: "Email verified successfully (development mode)" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Development verification error:", error);
    return NextResponse.json(
      { message: "An error occurred during verification" },
      { status: 500 }
    );
  }
}