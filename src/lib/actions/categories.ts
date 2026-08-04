"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export type CategoryFormState = { error?: string };

export async function createCategory(
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: "Category name is required." };

  try {
    await db.insert(categories).values({ name });
  } catch {
    return { error: "A category with that name already exists." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/stock");
  return {};
}

export async function renameCategory(
  id: string,
  _prevState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  await requireAdmin();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: "Category name is required." };

  try {
    await db.update(categories).set({ name }).where(eq(categories.id, id));
  } catch {
    return { error: "A category with that name already exists." };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/stock");
  return {};
}

export async function deleteCategory(id: string): Promise<CategoryFormState> {
  await requireAdmin();

  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch {
    return {
      error:
        "This category still has items in stock. Archive or move those items first.",
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/stock");
  return {};
}
