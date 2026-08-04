import type { DefaultSession } from "next-auth";

export type UserRole = "admin" | "sales";

declare module "next-auth" {
  interface User {
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

// next-auth/jwt re-exports JWT from @auth/core/jwt, and NextAuthConfig's
// callback signatures are typed against the latter directly, so it must
// be augmented too for declaration merging to apply to `token` in callbacks.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}
