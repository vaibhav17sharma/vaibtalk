import { PrismaClient } from "@/lib/generated/prisma";
import { Account, NextAuthOptions, Profile, Session, User } from "next-auth";
import { AdapterUser } from "next-auth/adapters";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

const prisma = new PrismaClient();

interface GoogleProfile extends Profile {
  email_verified: boolean;
  email: string;
  name: string;
  picture: string;
}

export const authOptions: NextAuthOptions = {
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
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 1 day
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({
      account,
      profile,
    }: {
      user: User | AdapterUser;
      account: Account | null;
      profile?: Profile;
      email?: { verificationRequest?: boolean };
      credentials?: Record<string, unknown>;
    }) {
      if (account?.provider === "google" && profile) {
        const googleProfile = profile as GoogleProfile;

        if (
          googleProfile.email_verified &&
          googleProfile.email.endsWith("@gmail.com")
        ) {
          let logginguser = await prisma.user.findUnique({
            where: { email: googleProfile.email },
          });

          if (!logginguser) {
            const username =
              googleProfile.email.split("@")[0] +
              "-" +
              Math.random().toString(36).substring(2, 8);

            logginguser = await prisma.user.create({
              data: {
                email: googleProfile.email,
                name: googleProfile.name || username,
                username,
                avatar: googleProfile.picture,
              },
            });
          }

          await prisma.userSession.upsert({
            where: { userId: logginguser.id },
            update: {
              isOnline: true,
              lastSeen: new Date(),
              updatedAt: new Date(),
            },
            create: {
              userId: logginguser.id,
              isOnline: true,
            },
          });

          return true;
        }
      }

      return false;
    },

    async jwt({ token, user }) {
      const email = user?.email ?? (token.email as string);

      if (email) {
        const dbUser = await prisma.user.findUnique({
          where: { email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.profileCompleted = dbUser.profileCompleted;
          token.uniqueID = dbUser.username;
        }
      }

      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.uniqueID = token.uniqueID as string;
        (session.user as any).profileCompleted = token.profileCompleted;
      }

      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  events: {
    async signOut(message) {
      const token = message.token as JWT;

      if (token && token.id) {
        try {
          await prisma.userSession.updateMany({
            where: { userId: token.id },
            data: {
              isOnline: false,
              lastSeen: new Date(),
            },
          });
          console.log(`User ${token.id} marked offline.`);
        } catch (error) {
          console.error("Failed to update user session on sign out:", error);
        }
      } else {
        console.warn("No token.id found in signOut event.");
      }
    },
  },
};
