import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "online",
          include_granted_scopes: false,
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    session: async ({ session, user }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
        },
      };
    },
    // 👇 Fires every time a user signs in
    signIn: async ({ user }) => {
      if (!user.email || !user.id) return true;

      try {
        // Find all tasks pending for this email
        const pendingTasks = await prisma.task.findMany({
          where: {
            pendingAssigneeEmail: user.email.toLowerCase(),
          },
        });

        if (pendingTasks.length > 0) {
          // Link all pending tasks to this user
          await prisma.task.updateMany({
            where: {
              pendingAssigneeEmail: user.email.toLowerCase(),
            },
            data: {
              assigneeId: user.id,
              pendingAssigneeEmail: null,
            },
          });
        }
      } catch (error) {
        console.error("Error linking pending tasks:", error);
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
  },
});