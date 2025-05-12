import { randomBytes } from "crypto";
import { prisma } from "./prisma";

export async function generateVerificationToken(userId: string, email: string): Promise<string> {
  // Create a random token
  const token = randomBytes(32).toString('hex');
  
  // Set expiration time (24 hours from now)
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  
  // Store the token in the database
  await prisma.verificationToken.create({
    data: {
      identifier: userId,
      token,
      expires,
    },
  });
  
  return token;
}

export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
  // Find the token in the database
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });
  
  if (!verificationToken) {
    return null;
  }
  
  // Check if the token has expired
  if (verificationToken.expires < new Date()) {
    // Delete expired token
    await prisma.verificationToken.delete({
      where: { token },
    });
    return null;
  }
  
  // Find the user associated with this token
  const user = await prisma.user.findUnique({
    where: { id: verificationToken.identifier },
    select: { id: true, email: true, emailVerified: true },
  });
  
  if (!user || !user.email) {
    return null;
  }
  
  // Delete the token as it's being used
  await prisma.verificationToken.delete({
    where: { token },
  });
  
  return { userId: user.id, email: user.email };
}