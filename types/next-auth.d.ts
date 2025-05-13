import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      uniqueID: string;
      profileCompleted: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    uniqueID: string;
    profileCompleted: boolean;
  }
}
