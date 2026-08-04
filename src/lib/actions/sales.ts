"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { items, sales, shifts } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export type SaleFormState = { error?: string };

export async function recordSale(
  shiftId: string,
  _prevState: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  const session = await auth();
  if (session?.user?.role !== "sales") {
    throw new Error("Unauthorized");
  }

  const itemId = formData.get("itemId") as string | null;
  const quantityRaw = formData.get("quantity") as string | null;
  const quantitySold = Number(quantityRaw);

  if (!itemId) return { error: "Missing item." };
  if (!quantityRaw || !Number.isInteger(quantitySold) || quantitySold <= 0) {
    return { error: "Enter a valid quantity." };
  }

  const [shift] = await db
    .select({ id: shifts.id })
    .from(shifts)
    .where(
      and(
        eq(shifts.id, shiftId),
        eq(shifts.salesAssistantId, session.user.id),
        eq(shifts.status, "active"),
      ),
    )
    .limit(1);

  if (!shift) return { error: "This shift is no longer active." };

  // Single atomic UPDATE guarded by quantity >= sold: this is what prevents
  // overselling when multiple sales assistants sell the same item at once.
  const [updated] = await db
    .update(items)
    .set({
      quantity: sql`${items.quantity} - ${quantitySold}`,
      updatedAt: new Date(),
    })
    .where(and(eq(items.id, itemId), gte(items.quantity, quantitySold)))
    .returning({ price: items.price });

  if (!updated) {
    return { error: "Not enough stock left for that quantity." };
  }

  const unitPrice = Number(updated.price);
  await db.insert(sales).values({
    shiftId,
    itemId,
    quantitySold,
    unitPriceAtSale: unitPrice.toFixed(2),
    totalAmount: (unitPrice * quantitySold).toFixed(2),
  });

  revalidatePath("/sales");
  revalidatePath("/sales/sales");
  revalidatePath("/sales/stock");
  return {};
}
