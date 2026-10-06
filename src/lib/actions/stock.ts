"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
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
  const costPriceRaw = (formData.get("costPrice") as string | null)?.trim();

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

  // Original (cost) price is optional — blank means "not set".
  let costPrice: number | null = null;
  if (costPriceRaw) {
    costPrice = Number(costPriceRaw);
    if (Number.isNaN(costPrice) || costPrice < 0) {
      return { error: "Enter a valid original price, or leave it blank." } as const;
    }
  }

  return { name, categoryId, price, quantity, costPrice } as const;
}

// Names are compared trimmed and case-insensitively; archived items don't
// count, so an archived product's name can be reused.
async function findDuplicateName(name: string, excludeId?: string) {
  const [duplicate] = await db
    .select({ name: items.name })
    .from(items)
    .where(
      and(
        eq(items.isArchived, false),
        sql`lower(trim(${items.name})) = ${name.toLowerCase()}`,
        excludeId ? ne(items.id, excludeId) : undefined,
      ),
    )
    .limit(1);
  return duplicate;
}

function duplicateError(name: string): ItemFormState {
  return { error: `A product named "${name}" already exists.` };
}

export async function createItem(
  _prevState: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  await requireAdmin();

  const parsed = parseItemForm(formData);
  if ("error" in parsed) return parsed;

  const duplicate = await findDuplicateName(parsed.name);
  if (duplicate) return duplicateError(duplicate.name);

  await db.insert(items).values({
    name: parsed.name,
    categoryId: parsed.categoryId,
    price: parsed.price.toFixed(2),
    costPrice: parsed.costPrice?.toFixed(2) ?? null,
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

  const duplicate = await findDuplicateName(parsed.name, id);
  if (duplicate) return duplicateError(duplicate.name);

  await db
    .update(items)
    .set({
      name: parsed.name,
      categoryId: parsed.categoryId,
      price: parsed.price.toFixed(2),
      costPrice: parsed.costPrice?.toFixed(2) ?? null,
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
