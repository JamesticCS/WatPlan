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

    const result = userSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const normalizedEmail = result.data.email.toLowerCase().trim();
    const password = result.data.password;

    // Check if user already exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: {
        email: {
          mode: 'insensitive',
          equals: normalizedEmail
        }
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      // Clean up any existing users with this email that might cause constraint issues
      const deletedUsers = await prisma.user.findMany({
        where: {
          email: {
            mode: 'insensitive',
            equals: normalizedEmail
          }
        },
      });

      if (deletedUsers.length > 0) {
        for (const deletedUser of deletedUsers) {
          await prisma.verificationToken.deleteMany({
            where: { identifier: deletedUser.id }
          });
          await prisma.user.delete({
            where: { id: deletedUser.id }
          });
        }
      }

      user = await prisma.user.create({
        data: {
          name: normalizedEmail.split('@')[0],
          email: normalizedEmail,
          password: hashedPassword,
          emailVerified: null,
        },
      });
    } catch (createError: any) {
      console.error("Error creating user:", createError);

      if (createError.code === 'P2002' ||
          (createError.message && createError.message.includes('Unique constraint'))) {
        return NextResponse.json(
          { message: "This email is already registered. Please use a different email or try logging in." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { message: "Failed to create user account." },
        { status: 500 }
      );
    }

    let emailSent = false;

    try {
      const verificationToken = await generateVerificationToken(user.id, normalizedEmail);

      try {
        await sendVerificationEmail(normalizedEmail, verificationToken);
        emailSent = true;
      } catch (emailError) {
        console.error("Error sending verification email:", emailError);
      }
    } catch (tokenError) {
      console.error("Error generating verification token:", tokenError);
    }

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
