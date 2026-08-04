"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export type ItemFormState = { error?: string };

function parseItemForm(formData: FormData) {
  const name = (formData.get("name") as string | null)?.trim();
  const categoryId = formData.get("categoryId") as string | null;
  const priceRaw = formData.get("price") as string | null;
  const quantityRaw = formData.get("quantity") as string | null;

  if (!name) return { error: "Item name is required." } as const;
  if (!categoryId) return { error: "Category is required." } as const;

  const price = Number(priceRaw);
  if (!priceRaw || Number.isNaN(price) || price < 0) {
    return { error: "Enter a valid price." } as const;
  }

  const quantity = Number(quantityRaw);
  if (!quantityRaw || !Number.isInteger(quantity) || quantity < 0) {
    return { error: "Enter a valid whole-number quantity." } as const;
  }

  return { name, categoryId, price, quantity } as const;
}

export async function createItem(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  await requireAdmin();

  const parsed = parseItemForm(formData);
  if ("error" in parsed) return parsed;

  await db.insert(items).values({
    name: parsed.name,
    categoryId: parsed.categoryId,
    price: parsed.price.toFixed(2),
    quantity: parsed.quantity,
  });

  revalidatePath("/admin/stock");
  return {};
}

export async function updateItem(
  id: string,
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  await requireAdmin();

  const parsed = parseItemForm(formData);
  if ("error" in parsed) return parsed;

  await db
    .update(items)
    .set({
      name: parsed.name,
      categoryId: parsed.categoryId,
      price: parsed.price.toFixed(2),
      quantity: parsed.quantity,
      updatedAt: new Date(),
    })
    .where(eq(items.id, id));

  revalidatePath("/admin/stock");
  return {};
}

export async function archiveItem(id: string) {
  await requireAdmin();

  await db
    .update(items)
    .set({ isArchived: true, updatedAt: new Date() })
    .where(eq(items.id, id));

  revalidatePath("/admin/stock");
  revalidatePath("/menu");
}
