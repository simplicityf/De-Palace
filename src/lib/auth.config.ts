import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe config (no DB/bcrypt imports) shared by middleware and the
 * full auth.ts. Providers are added in auth.ts, which runs on the Node runtime.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;
      const path = nextUrl.pathname;

      const isAdminArea = path.startsWith("/admin") && path !== "/admin/login";
      const isSalesArea = path.startsWith("/sales") && path !== "/sales/login";

      if (isAdminArea) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/admin/login", nextUrl));
        }
        if (role !== "admin") {
          return Response.redirect(new URL("/", nextUrl));
        }
      }

      if (isSalesArea) {
        if (!isLoggedIn) {
          return Response.redirect(new URL("/sales/login", nextUrl));
        }
        if (role !== "sales") {
          return Response.redirect(new URL("/", nextUrl));
        }
      }

      return true;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
