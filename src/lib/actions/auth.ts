"use server";

import { AuthError } from "next-auth";
import { auth, signIn, signOut } from "@/lib/auth";

export type LoginState = { error?: string };

async function login(formData: FormData, redirectTo: string): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo,
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }
}

export async function loginAdmin(_prevState: LoginState, formData: FormData) {
  return login(formData, "/admin");
}

export async function loginSales(_prevState: LoginState, formData: FormData) {
  return login(formData, "/sales");
}

export async function logout() {
  const session = await auth();
  const redirectTo = session?.user?.role === "admin" ? "/admin/login" : "/sales/login";
  await signOut({ redirectTo });
}
