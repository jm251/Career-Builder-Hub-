import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.GITHUB_ID && process.env.GITHUB_SECRET) {
  providers.push(
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  );
}

export const availableAuthProviders = {
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  github: Boolean(process.env.GITHUB_ID && process.env.GITHUB_SECRET),
};

export const authConfig = {
  adapter: PrismaAdapter(db),
  providers,
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, user }: { session: any; user: any }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
  session: {
    strategy: "database",
  },
} satisfies Parameters<typeof NextAuth>[0];

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
