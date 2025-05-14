import { PrismaAdapter } from "@auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

// Logger helper for authentication events
const authLogger = {
  log: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUTH] ${message}`);
    }
  },
  error: (message: string, err?: any) => {
    console.error(`[AUTH ERROR] ${message}`, err || '');
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        // Log profile data for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          authLogger.log(`GitHub profile data: ${JSON.stringify(profile, null, 2)}`);
        }
        return {
          id: profile.id.toString(),
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) {
          return null;
        }

        // Check for email verification status if not a guest
        if (!user.isGuest && !user.emailVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          return null;
        }

        return user;
      },
    }),
    // Guest provider
    CredentialsProvider({
      id: "guest",
      name: "guest",
      credentials: {},
      async authorize() {
        const guestUser = await prisma.user.create({
          data: {
            name: `Guest-${randomUUID().slice(0, 8)}`,
            email: `guest-${randomUUID()}@watplan.temp`,
            isGuest: true,
            guestExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          },
        });

        return guestUser;
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user, token }) {
      // Keep this simple for now - just add the user ID and guest status to the session
      if (session.user) {
        if (user) {
          session.user.id = user.id;
          session.user.isGuest = user.isGuest || false;
        } else if (token) {
          session.user.id = token.sub as string;
          session.user.isGuest = token.isGuest as boolean || false;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      // Enhanced debugging for auth issues
      if (process.env.NODE_ENV === 'development') {
        if (account) {
          authLogger.log(`JWT callback - Account provider: ${account.provider}`);
          authLogger.log(`JWT callback - Account type: ${account.type}`);
        }
        if (user) {
          authLogger.log(`JWT callback - User ID: ${user.id}`);
          authLogger.log(`JWT callback - User email: ${user.email}`);
        }
      }
      
      // Just preserve the user's guest status in the token
      if (user) {
        token.isGuest = user.isGuest || false;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Log redirect for debugging
      if (process.env.NODE_ENV === 'development') {
        authLogger.log(`Redirect callback - URL: ${url}`);
        authLogger.log(`Redirect callback - Base URL: ${baseUrl}`);
        authLogger.log(`Redirect callback - Final URL: ${baseUrl}/plans`);
      }
      
      // Always redirect to /plans for simplicity
      return `${baseUrl}/plans`;
    }
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  // Disable automatic session loading on initial page load
  useSecureCookies: process.env.NODE_ENV === "production",
};