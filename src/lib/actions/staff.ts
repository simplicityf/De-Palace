"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export type StaffFormState = { error?: string };

export async function createSalesAssistant(
  _prevState: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  await requireAdmin();

  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = formData.get("password") as string | null;

  if (!name) return { error: "Name is required." };
  if (!email) return { error: "Email is required." };
  if (!password || password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.insert(users).values({
      name,
      email,
      passwordHash,
      role: "sales",
    });
  } catch {
    return { error: "A user with that email already exists." };
  }

  revalidatePath("/admin/staff");
  return {};
}

export async function updateSalesAssistant(
  id: string,
  _prevState: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  await requireAdmin();

  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim().toLowerCase();
  const password = (formData.get("password") as string | null) || "";

  if (!name) return { error: "Name is required." };
  if (!email) return { error: "Email is required." };
  if (password && password.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  const update: { name: string; email: string; passwordHash?: string } = {
    name,
    email,
  };
  if (password) {
    update.passwordHash = await bcrypt.hash(password, 12);
  }

  try {
    await db.update(users).set(update).where(eq(users.id, id));
  } catch {
    return { error: "A user with that email already exists." };
  }

  revalidatePath("/admin/staff");
  return {};
}

export async function setStaffActive(id: string, isActive: boolean) {
  await requireAdmin();

  await db.update(users).set({ isActive }).where(eq(users.id, id));

  revalidatePath("/admin/staff");
}
