import NextAuth from "next-auth";
import type { Session } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import GithubProvider from "next-auth/providers/github";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  callbacks: {
    session(props: { session: Session; user?: { id?: string } }) {
      const { session, user } = props;
      if (session.user && user?.id) {
        (session.user as { id?: string }).id = user.id;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
