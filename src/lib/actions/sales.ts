"use server";

import { revalidatePath } from "next/cache";
import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { items, sales, shifts } from "@/lib/db/schema";
import { auth } from "@/lib/auth";

export type SaleFormState = { error?: string };

function parseSaleForm(formData: FormData) {
  const itemId = formData.get("itemId") as string | null;
  const quantityRaw = formData.get("quantity") as string | null;
  const quantitySold = Number(quantityRaw);

  if (!itemId) return { error: "Missing item." } as const;
  if (!quantityRaw || !Number.isInteger(quantitySold) || quantitySold <= 0) {
    return { error: "Enter a valid quantity." } as const;
  }

  return { itemId, quantitySold } as const;
}

// Single atomic UPDATE guarded by quantity >= sold: this is what prevents
// overselling when multiple people sell the same item at once.
async function decrementStockAndRecordSale(
  itemId: string,
  quantitySold: number,
  attribution: { shiftId: string | null; recordedByUserId: string | null },
): Promise<SaleFormState> {
  const [updated] = await db
    .update(items)
    .set({
      quantity: sql`${items.quantity} - ${quantitySold}`,
      updatedAt: new Date(),
    })
    .where(and(eq(items.id, itemId), gte(items.quantity, quantitySold)))
    .returning({ price: items.price, costPrice: items.costPrice });

  if (!updated) {
    return { error: "Not enough stock left for that quantity." };
  }

  const unitPrice = Number(updated.price);
  await db.insert(sales).values({
    shiftId: attribution.shiftId,
    recordedByUserId: attribution.recordedByUserId,
    itemId,
    quantitySold,
    unitPriceAtSale: unitPrice.toFixed(2),
    totalAmount: (unitPrice * quantitySold).toFixed(2),
    costPriceAtSale: updated.costPrice,
  });

  return {};
}

export async function recordSale(
  shiftId: string,
  _prevState: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  const session = await auth();
  if (session?.user?.role !== "sales") {
    throw new Error("Unauthorized");
  }

  const parsed = parseSaleForm(formData);
  if ("error" in parsed) return parsed;

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

  const result = await decrementStockAndRecordSale(
    parsed.itemId,
    parsed.quantitySold,
    { shiftId, recordedByUserId: null },
  );
  if (result.error) return result;

  revalidatePath("/sales");
  revalidatePath("/sales/sales");
  revalidatePath("/sales/stock");
  return {};
}

export async function recordAdminSale(
  _prevState: SaleFormState,
  formData: FormData,
): Promise<SaleFormState> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const parsed = parseSaleForm(formData);
  if ("error" in parsed) return parsed;

  const result = await decrementStockAndRecordSale(
    parsed.itemId,
    parsed.quantitySold,
    { shiftId: null, recordedByUserId: session.user.id },
  );
  if (result.error) return result;

  revalidatePath("/admin");
  revalidatePath("/admin/sales");
  revalidatePath("/admin/sales/history");
  revalidatePath("/admin/stock");
  return {};
}
