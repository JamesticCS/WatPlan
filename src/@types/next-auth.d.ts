import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      isGuest?: boolean;
    };
  }
  
  interface User {
    isGuest?: boolean;
    guestExpiresAt?: Date;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isGuest?: boolean;
  }
}