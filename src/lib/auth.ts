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
      clientSecret: process.env.GITHUB_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID ?? "",
      clientSecret: process.env.GOOGLE_SECRET ?? "",
      allowDangerousEmailAccountLinking: true,
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
    async signIn({ user, account, profile }) {
      // Log sign in attempts
      authLogger.log(`Sign in attempt for ${user?.email || 'unknown user'} with ${account?.provider || 'unknown provider'}`);
      
      if (!user || !account) {
        authLogger.error('SignIn callback received incomplete data', { user, account });
        return false;
      }
      
      return true;
    },
    async session({ session, user, token }) {
      authLogger.log(`Session callback for ${session?.user?.email || 'unknown user'}`);
      
      if (session.user) {
        if (user) {
          session.user.id = user.id;
          session.user.isGuest = user.isGuest || false;
        } else if (token) {
          // When using JWT strategy
          session.user.id = token.sub as string;
          session.user.isGuest = token.isGuest as boolean || false;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account) {
        authLogger.log(`JWT callback for ${account.provider} authentication`);
      }
      
      if (user) {
        token.isGuest = user.isGuest || false;
      }
      
      // Store additional info from OAuth providers
      if (account?.provider) {
        token.provider = account.provider;
      }
      
      return token;
    },
    async redirect({ url, baseUrl }) {
      authLogger.log(`Redirect callback from ${url}`);
      
      // Ensure we always redirect to the plans page after OAuth login
      // This helps overcome issues with callback redirection
      if (url.startsWith('/api/auth/callback')) {
        const redirectUrl = `${baseUrl}/plans`;
        authLogger.log(`Redirecting OAuth callback to ${redirectUrl}`);
        return redirectUrl;
      }
      
      // Standard redirect logic
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      return baseUrl;
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