import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { encodeEmailToSecret } from "./utils";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 1 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ account, profile } : any) {
      if (account.provider === "google") {
        return profile.email_verified && profile.email.endsWith("@gmail.com");
      }
      return true; 
    },
    session: ({ session, token, user }: any) => {
      if (session.user) {
          session.user.uniqueID = encodeEmailToSecret(session.user.email);
      }
      return {
        ...session,
        user: {
          ...session.user,
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          uniqueID: session.user.uniqueID,
        },
      }
  }
  },
  pages: {
    signIn: "/signin",
  },
} satisfies NextAuthOptions;
