import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      uniqueID: string
    } & DefaultSession["user"]
  }
}